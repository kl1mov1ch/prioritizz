import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { loadEnv } from '@prioritizz/config';
import { DOMAIN_EVENTS, ERROR_CODES, ROLES } from '@prioritizz/constants';
import type { AdminLoginInput, AuthResponse } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { TelegramInitDataService } from './telegram-init-data.service';
import { TokenService } from './token.service';

interface DeviceMeta {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly initData: TelegramInitDataService,
    private readonly tokens: TokenService,
    private readonly events: EventEmitter2,
  ) {}

  /** Mini App login: verify initData, upsert the user, open a session. */
  async loginWithTelegram(rawInitData: string, device: DeviceMeta): Promise<AuthResponse> {
    const parsed = this.initData.verify(rawInitData);
    if (!parsed.user) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'initData has no user');
    }
    const tg = parsed.user;

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tg.id) },
      create: {
        telegramId: BigInt(tg.id),
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        languageCode: tg.language_code ?? null,
        photoUrl: tg.photo_url ?? null,
        isPremium: tg.is_premium ?? false,
        buyerProfile: {
          create: {
            displayName: [tg.first_name, tg.last_name].filter(Boolean).join(' ') || 'User',
          },
        },
      },
      update: {
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        photoUrl: tg.photo_url ?? null,
        isPremium: tg.is_premium ?? false,
        lastSeenAt: new Date(),
      },
      include: { sellerProfile: true },
    });

    this.assertUsable(user.status);

    const isNew = user.createdAt.getTime() === user.updatedAt.getTime();
    if (isNew) {
      this.events.emit(DOMAIN_EVENTS.USER_REGISTERED, { userId: user.id });
    }

    return this.openSession(user, device, false);
  }

  /**
   * Telegram Login Widget sign-in (admin panel opened in a browser).
   * `requireAdmin` gates the allowlist: the same verified identity can also be
   * used for a plain user session if we ever expose widget login to buyers.
   */
  async loginWithWidget(
    payload: Record<string, unknown>,
    device: DeviceMeta,
    requireAdmin: boolean,
  ): Promise<AuthResponse> {
    const tg = this.initData.verifyLoginWidget(payload);

    if (requireAdmin) {
      if (!this.isAllowlisted(tg.id, tg.username)) {
        throw new AppException(ERROR_CODES.AUTH_ADMIN_NOT_ALLOWLISTED, 'Not on admin allowlist');
      }
      const userId = await this.provisionAdmin(tg, device);
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { sellerProfile: true },
      });
      this.assertUsable(user.status);
      return this.openSession(user, device, true);
    }

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tg.id) },
      create: {
        telegramId: BigInt(tg.id),
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        photoUrl: tg.photo_url ?? null,
        buyerProfile: {
          create: { displayName: [tg.first_name, tg.last_name].filter(Boolean).join(' ') || 'User' },
        },
      },
      update: {
        username: tg.username ?? null,
        photoUrl: tg.photo_url ?? null,
        lastSeenAt: new Date(),
      },
      include: { sellerProfile: true },
    });
    this.assertUsable(user.status);
    return this.openSession(user, device, false);
  }

  async adminLogin(input: AdminLoginInput, device: DeviceMeta): Promise<AuthResponse> {
    let userId: string;

    if (input.initData) {
      const parsed = this.initData.verify(input.initData);
      if (!parsed.user) throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'no user');
      if (!this.isAllowlisted(parsed.user.id, parsed.user.username)) {
        throw new AppException(ERROR_CODES.AUTH_ADMIN_NOT_ALLOWLISTED, 'Not on admin allowlist');
      }
      userId = await this.provisionAdmin(parsed.user, device);
    } else {
      // email + password (+ TOTP) fallback — hashing/TOTP check wired in M1
      throw new AppException(ERROR_CODES.AUTH_TOKEN_INVALID, 'Email login not enabled yet');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { sellerProfile: true },
    });
    this.assertUsable(user.status);
    return this.openSession(user, device, true);
  }

  async refresh(refreshToken: string, device: DeviceMeta): Promise<AuthResponse> {
    const hash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshHash: hash },
      include: { user: { include: { sellerProfile: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppException(ERROR_CODES.AUTH_SESSION_REVOKED, 'Refresh token invalid');
    }
    this.assertUsable(session.user.status);

    // rotate
    const rotated = await this.tokens.buildPair({
      userId: session.userId,
      sessionId: session.id,
      roles: session.user.roles,
    });
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshHash: rotated.refreshHash,
        expiresAt: rotated.refreshExpiresAt,
        lastUsedAt: new Date(),
        ip: device.ip ?? session.ip,
        userAgent: device.userAgent ?? session.userAgent,
      },
    });
    return { user: this.toAuthUser(session.user), tokens: rotated.pair };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        deviceLabel: true,
        userAgent: true,
        ip: true,
        isAdminSession: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  // ---- admin allowlist ----

  /**
   * ADMIN_TELEGRAM_ALLOWLIST accepts numeric Telegram ids and @usernames.
   * Numeric ids are preferred — a username can be released and re-registered
   * by someone else, an id cannot. Usernames are matched case-insensitively.
   */
  private isAllowlisted(telegramId: number, username?: string): boolean {
    const entries = this.env.ADMIN_TELEGRAM_ALLOWLIST.map((e) => e.trim()).filter(Boolean);
    if (entries.length === 0) return false;
    const uname = username?.toLowerCase();
    return entries.some((entry) => {
      if (/^\d+$/.test(entry)) return entry === String(telegramId);
      return !!uname && entry.replace(/^@/, '').toLowerCase() === uname;
    });
  }

  /**
   * First allowlisted sign-in bootstraps the operator account: creates/updates
   * the User from initData, attaches an AdminUser record and grants SUPERADMIN.
   * Any AdminUser that is no longer on the allowlist is deactivated in the same
   * pass, so the allowlist stays the single source of truth for admin access.
   */
  private async provisionAdmin(
    tg: { id: number; username?: string; first_name?: string; last_name?: string },
    device: DeviceMeta,
  ): Promise<string> {
    const displayName = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || 'Operator';

    // Telegram usernames are globally unique, so any other row still holding
    // this handle is a stale copy — drop it before matching the allowlist,
    // otherwise a released handle could keep granting access to the old id.
    if (tg.username) {
      await this.prisma.user.updateMany({
        where: { username: tg.username, telegramId: { not: BigInt(tg.id) } },
        data: { username: null },
      });
    }

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tg.id) },
      create: {
        telegramId: BigInt(tg.id),
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        roles: [ROLES.USER, ROLES.SUPERADMIN],
        buyerProfile: { create: { displayName } },
      },
      update: {
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        lastSeenAt: new Date(),
      },
      select: { id: true, roles: true },
    });

    if (!user.roles.includes(ROLES.SUPERADMIN)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { roles: { push: ROLES.SUPERADMIN } },
      });
    }

    await this.prisma.adminUser.upsert({
      where: { userId: user.id },
      create: { userId: user.id, isAllowlisted: true, lastLoginAt: new Date() },
      update: { isAllowlisted: true, lastLoginAt: new Date() },
    });

    await this.revokeStaleAdmins(user.id);

    await this.prisma.auditLog.create({
      data: {
        actorType: 'ADMIN',
        actorId: user.id,
        action: 'admin.login',
        targetType: 'AdminUser',
        targetId: user.id,
        after: { telegramId: String(tg.id), username: tg.username ?? null },
        ip: device.ip ?? null,
        userAgent: device.userAgent ?? null,
      },
    });

    return user.id;
  }

  /** Deactivate every admin account whose identity left the allowlist. */
  private async revokeStaleAdmins(keepUserId: string): Promise<void> {
    const admins = await this.prisma.adminUser.findMany({
      where: { isAllowlisted: true, userId: { not: keepUserId } },
      select: { id: true, userId: true, user: { select: { telegramId: true, username: true } } },
    });

    for (const admin of admins) {
      if (this.isAllowlisted(Number(admin.user.telegramId), admin.user.username ?? undefined)) {
        continue;
      }
      await this.prisma.$transaction([
        this.prisma.adminUser.update({ where: { id: admin.id }, data: { isAllowlisted: false } }),
        this.prisma.user.update({
          where: { id: admin.userId },
          data: { roles: { set: [ROLES.USER] } },
        }),
        // kill any live admin session for the revoked operator
        this.prisma.session.updateMany({
          where: { userId: admin.userId, isAdminSession: true, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        this.prisma.auditLog.create({
          data: {
            actorType: 'SYSTEM',
            action: 'admin.revoked',
            targetType: 'AdminUser',
            targetId: admin.userId,
            before: { isAllowlisted: true },
            after: { isAllowlisted: false, reason: 'not on ADMIN_TELEGRAM_ALLOWLIST' },
          },
        }),
      ]);
    }
  }

  // ---- helpers ----

  private assertUsable(status: string) {
    if (status === 'BANNED' || status === 'SUSPENDED') {
      throw new AppException(ERROR_CODES.AUTH_FORBIDDEN_ROLE, `Account ${status.toLowerCase()}`);
    }
  }

  private async openSession(
    user: Prisma.UserGetPayload<{ include: { sellerProfile: true } }>,
    device: DeviceMeta,
    isAdmin: boolean,
  ): Promise<AuthResponse> {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: 'pending',
        expiresAt: new Date(Date.now() + this.env.JWT_REFRESH_TTL * 1000),
        ip: device.ip ?? null,
        userAgent: device.userAgent ?? null,
        isAdminSession: isAdmin,
      },
    });
    const built = await this.tokens.buildPair({
      userId: user.id,
      sessionId: session.id,
      roles: user.roles,
    });
    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash: built.refreshHash, expiresAt: built.refreshExpiresAt },
    });
    return { user: this.toAuthUser(user), tokens: built.pair };
  }

  private toAuthUser(
    user: Prisma.UserGetPayload<{ include: { sellerProfile: true } }>,
  ): AuthResponse['user'] {
    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      languageCode: user.languageCode,
      roles: user.roles,
      status: user.status,
      isSeller: user.roles.includes(ROLES.SELLER) && !!user.sellerProfile,
    };
  }
}

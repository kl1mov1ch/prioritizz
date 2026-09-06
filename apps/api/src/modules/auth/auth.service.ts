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

  async adminLogin(input: AdminLoginInput, device: DeviceMeta): Promise<AuthResponse> {
    let userId: string;

    if (input.initData) {
      const parsed = this.initData.verify(input.initData);
      if (!parsed.user) throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'no user');
      const allow = this.env.ADMIN_TELEGRAM_ALLOWLIST;
      if (!allow.includes(String(parsed.user.id))) {
        throw new AppException(ERROR_CODES.AUTH_ADMIN_NOT_ALLOWLISTED, 'Not on admin allowlist');
      }
      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(parsed.user.id) },
        include: { adminUser: true },
      });
      if (!user?.adminUser?.isAllowlisted) {
        throw new AppException(ERROR_CODES.AUTH_ADMIN_NOT_ALLOWLISTED, 'No admin account');
      }
      userId = user.id;
    } else {
      // email + password (+ TOTP) fallback — hashing/TOTP check wired in M1
      throw new AppException(ERROR_CODES.AUTH_TOKEN_INVALID, 'Email login not enabled yet');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { sellerProfile: true },
    });
    this.assertUsable(user.status);
    await this.prisma.adminUser.update({
      where: { userId },
      data: { lastLoginAt: new Date() },
    });
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

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES, ROLES } from '@prioritizz/constants';
import type { BecomeSellerInput, UpdateMeInput } from '@prioritizz/schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AppException } from '../../common/errors/app-exception';
import { S3Service } from '../media/s3.service';
import { loadEnv } from '@prioritizz/config';

@Injectable()
export class UsersService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly events: EventEmitter2,
    private readonly s3: S3Service,
  ) {}

  /**
   * Pulls the caller's current Telegram profile photo through the Bot API and
   * mirrors it into our own storage — Telegram's `t.me/i/userpic` URLs expire
   * and are not reliably loadable inside the WebView, so we can't just store
   * the link.
   */
  async syncAvatarFromTelegram(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { telegramId: true },
    });
    const api = `https://api.telegram.org/bot${this.env.TELEGRAM_BOT_TOKEN}`;

    const photos = await fetch(
      `${api}/getUserProfilePhotos?user_id=${user.telegramId}&limit=1`,
    ).then((r) => r.json() as Promise<TgResponse<{ total_count: number; photos: TgPhoto[][] }>>);
    if (!photos.ok || !photos.result.photos.length) {
      throw new AppException(ERROR_CODES.NOT_FOUND, 'No Telegram profile photo to import');
    }
    // Each photo comes in several sizes; take the biggest.
    const sizes = photos.result.photos[0] ?? [];
    const biggest = sizes.reduce<TgPhoto | null>((a, b) => (a && a.width > b.width ? a : b), null);
    if (!biggest) {
      throw new AppException(ERROR_CODES.NOT_FOUND, 'No Telegram profile photo to import');
    }

    const file = await fetch(`${api}/getFile?file_id=${biggest.file_id}`).then(
      (r) => r.json() as Promise<TgResponse<{ file_path: string }>>,
    );
    if (!file.ok) throw new AppException(ERROR_CODES.INTERNAL, 'Telegram getFile failed');

    const download = await fetch(
      `https://api.telegram.org/file/bot${this.env.TELEGRAM_BOT_TOKEN}/${file.result.file_path}`,
    );
    const bytes = Buffer.from(new Uint8Array(await download.arrayBuffer()));

    const key = `user/${userId}/${randomUUID()}.jpg`;
    await this.s3.put(key, bytes, 'image/jpeg');
    const url = this.s3.publicUrl(key);

    await this.prisma.attachment.create({
      data: {
        ownerType: 'USER',
        ownerId: userId,
        uploaderId: userId,
        bucket: this.s3.bucket,
        key,
        url,
        mimeType: 'image/jpeg',
        sizeBytes: bytes.length,
        kind: 'image',
        isConfirmed: true,
      },
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: url },
      include: { buyerProfile: true, sellerProfile: true },
    });
    return this.serialize(updated);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { buyerProfile: true, sellerProfile: true },
    });
    return this.serialize(user);
  }

  async updateMe(userId: string, input: UpdateMeInput) {
    // Resolve an avatar attachment to its public URL; null clears the photo.
    let photoUrl: string | null | undefined;
    if (input.avatarAttachmentId === null) {
      photoUrl = null;
    } else if (input.avatarAttachmentId) {
      const att = await this.prisma.attachment.findFirst({
        where: {
          id: input.avatarAttachmentId,
          uploaderId: userId,
          ownerType: 'USER',
          isConfirmed: true,
          deletedAt: null,
        },
        select: { url: true },
      });
      if (!att) throw AppException.validation('Avatar attachment is unknown or not yours');
      photoUrl = att.url;
    }

    const mergedPrefs = input.notificationPrefs
      ? await this.mergePrefs(userId, input.notificationPrefs)
      : undefined;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName === undefined ? undefined : input.lastName,
        languageCode: input.languageCode,
        contactEmail: input.contactEmail === undefined ? undefined : input.contactEmail,
        photoUrl,
        notificationPrefs: mergedPrefs as Prisma.InputJsonValue | undefined,
      },
      include: { buyerProfile: true, sellerProfile: true },
    });
    return this.serialize(user);
  }

  /** Patch semantics for the prefs JSON blob — keep keys the client didn't send. */
  private async mergePrefs(userId: string, patch: Record<string, boolean>) {
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { notificationPrefs: true },
    });
    const base = (current.notificationPrefs ?? {}) as Record<string, unknown>;
    return { ...base, ...patch };
  }

  async becomeSeller(userId: string, input: BecomeSellerInput) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) throw AppException.conflict('Seller profile already exists');

    const slug = await this.uniqueSlug(input.displayName);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: { push: ROLES.SELLER },
        sellerProfile: {
          create: {
            displayName: input.displayName,
            slug,
            about: input.about,
            contactHandle: input.contactHandle,
          },
        },
      },
      include: { buyerProfile: true, sellerProfile: true },
    });
    this.events.emit(DOMAIN_EVENTS.SELLER_ONBOARDED, { userId, sellerId: user.sellerProfile!.id });
    return this.serialize(user);
  }

  async wallet(userId: string) {
    const currency = this.env.PLATFORM_CURRENCY;
    const [available, pending, inEscrow] = await Promise.all([
      this.ledger.balance('USER', userId, currency, 'USER_AVAILABLE'),
      this.ledger.balance('USER', userId, currency, 'USER_PENDING'),
      this.ledger.balance('USER', userId, currency, 'ESCROW_HOLD'),
    ]);
    return {
      currency,
      available,
      pending,
      inEscrow,
      lifetimeEarned: '0',
      lifetimeSpent: '0',
    };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'seller';
    let slug = base;
    let n = 1;
    while (await this.prisma.sellerProfile.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }

  private serialize(
    user: Prisma.UserGetPayload<{ include: { buyerProfile: true; sellerProfile: true } }>,
  ) {
    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      languageCode: user.languageCode,
      contactEmail: user.contactEmail ?? null,
      notificationPrefs: (user.notificationPrefs ?? {}) as Record<string, boolean>,
      roles: user.roles,
      status: user.status,
      isSeller: !!user.sellerProfile,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      buyerProfile: user.buyerProfile
        ? {
            completedOrders: user.buyerProfile.completedOrders,
            disputeRate: user.buyerProfile.disputeRate,
            premiumUntil: user.buyerProfile.premiumUntil?.toISOString() ?? null,
          }
        : null,
      sellerProfile: user.sellerProfile
        ? {
            id: user.sellerProfile.id,
            displayName: user.sellerProfile.displayName,
            tier: user.sellerProfile.tier,
            ratingAvg: user.sellerProfile.ratingAvg,
            ratingCount: user.sellerProfile.ratingCount,
            completedOrders: user.sellerProfile.completedOrders,
            isVerified: user.sellerProfile.isVerified,
            premiumUntil: user.sellerProfile.premiumUntil?.toISOString() ?? null,
          }
        : null,
    };
  }
}

interface TgResponse<T> {
  ok: boolean;
  result: T;
}
interface TgPhoto {
  file_id: string;
  width: number;
  height: number;
}

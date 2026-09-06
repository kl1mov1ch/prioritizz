import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, ROLES } from '@prioritizz/constants';
import type { BecomeSellerInput, UpdateMeInput } from '@prioritizz/schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AppException } from '../../common/errors/app-exception';
import { loadEnv } from '@prioritizz/config';

@Injectable()
export class UsersService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly events: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { buyerProfile: true, sellerProfile: true },
    });
    return this.serialize(user);
  }

  async updateMe(userId: string, input: UpdateMeInput) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        languageCode: input.languageCode,
        contactEmail: input.contactEmail,
        notificationPrefs: input.notificationPrefs
          ? (input.notificationPrefs as Prisma.InputJsonValue)
          : undefined,
      },
      include: { buyerProfile: true, sellerProfile: true },
    });
    return this.serialize(user);
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
    const base = name
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

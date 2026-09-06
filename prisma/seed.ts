/* eslint-disable no-console */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Prioritizz…');

  // ---- platform ledger singletons ----
  const platformAccounts: Array<{ type: Prisma.LedgerAccountCreateInput['type'] }> = [
    { type: 'PLATFORM_REVENUE' },
    { type: 'PLATFORM_FEES_PAYABLE' },
    { type: 'PSP_CLEARING' },
    { type: 'PROMO_LIABILITY' },
  ];
  for (const acc of platformAccounts) {
    await prisma.ledgerAccount.upsert({
      where: {
        type_ownerType_ownerId_currency: {
          type: acc.type,
          ownerType: acc.type === 'PSP_CLEARING' ? 'PSP' : 'PLATFORM',
          ownerId: '',
          currency: 'XTR',
        },
      },
      create: {
        type: acc.type,
        ownerType: acc.type === 'PSP_CLEARING' ? 'PSP' : 'PLATFORM',
        ownerId: '',
        currency: 'XTR',
      },
      update: {},
    });
  }

  // ---- default commission rule ----
  await prisma.commissionRule.upsert({
    where: { id: 'rule_global_default' },
    create: {
      id: 'rule_global_default',
      name: 'Global default 10%',
      scope: 'GLOBAL',
      matcher: {},
      percentBps: 1000,
      minFee: new Prisma.Decimal('1'),
      priority: 1000,
    },
    update: {},
  });

  await prisma.commissionRule.upsert({
    where: { id: 'rule_gifts_5' },
    create: {
      id: 'rule_gifts_5',
      name: 'Telegram gifts 5%',
      scope: 'SERVICE_KIND',
      matcher: { serviceKind: 'TELEGRAM_GIFT' },
      percentBps: 500,
      priority: 200,
    },
    update: {},
  });

  // ---- categories ----
  const categories = [
    { slug: 'subscriptions', name: 'Подписки', icon: '📦' },
    { slug: 'telegram-gifts', name: 'Telegram Gifts', icon: '🎁' },
    { slug: 'digital-goods', name: 'Цифровые товары', icon: '🔑' },
    { slug: 'services', name: 'Услуги', icon: '🛠️' },
    { slug: 'top-ups', name: 'Пополнения', icon: '💳' },
  ];
  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, order: i },
      update: { name: c.name, icon: c.icon, order: i },
    });
  }

  // ---- subscription plans ----
  await prisma.subscriptionPlan.upsert({
    where: { code: 'seller_pro' },
    create: {
      code: 'seller_pro',
      name: 'Seller Pro',
      audience: 'SELLER',
      priceAmount: new Prisma.Decimal('299'),
      currency: 'XTR',
      interval: 'MONTH',
      perks: {
        commissionDiscountBps: 300,
        maxActiveListings: null,
        prioritySupport: true,
        featuredPlacement: true,
        reducedPayoutDelayHours: 24,
        buyerCashbackBps: 0,
      },
    },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { code: 'buyer_plus' },
    create: {
      code: 'buyer_plus',
      name: 'Buyer Plus',
      audience: 'BUYER',
      priceAmount: new Prisma.Decimal('99'),
      currency: 'XTR',
      interval: 'MONTH',
      perks: {
        commissionDiscountBps: 0,
        maxActiveListings: null,
        prioritySupport: true,
        featuredPlacement: false,
        reducedPayoutDelayHours: null,
        buyerCashbackBps: 200,
      },
    },
    update: {},
  });

  // ---- payment providers ----
  await prisma.paymentProviderConfig.upsert({
    where: { code: 'telegram_stars' },
    create: {
      code: 'telegram_stars',
      displayName: 'Telegram Stars',
      isEnabled: true,
      supportsRefund: true,
    },
    update: { isEnabled: true },
  });
  await prisma.paymentProviderConfig.upsert({
    where: { code: 'cryptopay' },
    create: { code: 'cryptopay', displayName: 'Crypto Pay', isEnabled: false },
    update: {},
  });

  // ---- feature flags ----
  const flags = [
    { key: 'referrals.enabled', description: 'Referral / affiliate module', enabled: false },
    { key: 'disputes.autoEscalate', description: 'Auto-escalate disputes past SLA', enabled: true },
    {
      key: 'catalog.autoModeration',
      description: 'Allow auto-moderation of listings',
      enabled: true,
    },
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      create: { ...f, rolloutPercentage: 100 },
      update: {},
    });
  }

  // ---- demo users (dev only) ----
  if (process.env.NODE_ENV !== 'production') {
    const seller = await prisma.user.upsert({
      where: { telegramId: BigInt(100000001) },
      create: {
        telegramId: BigInt(100000001),
        username: 'demo_seller',
        firstName: 'Demo',
        lastName: 'Seller',
        roles: ['USER', 'SELLER'],
        sellerProfile: {
          create: {
            displayName: 'Demo Seller',
            slug: 'demo-seller',
            tier: 'PRO',
            isVerified: true,
          },
        },
        buyerProfile: { create: { displayName: 'Demo Seller' } },
      },
      update: {},
      include: { sellerProfile: true },
    });

    await prisma.user.upsert({
      where: { telegramId: BigInt(100000002) },
      create: {
        telegramId: BigInt(100000002),
        username: 'demo_buyer',
        firstName: 'Demo',
        lastName: 'Buyer',
        roles: ['USER'],
        buyerProfile: { create: { displayName: 'Demo Buyer' } },
      },
      update: {},
    });

    const subsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'subscriptions' } });
    if (seller.sellerProfile) {
      await prisma.service.upsert({
        where: { slug: 'demo-spotify-premium' },
        create: {
          slug: 'demo-spotify-premium',
          sellerId: seller.sellerProfile.id,
          categoryId: subsCat.id,
          title: 'Spotify Premium — 1 месяц',
          summary: 'Активация Premium на ваш аккаунт, гарантия 30 дней',
          description: 'Полное описание условий, что требуется от покупателя и сроки выполнения.',
          kind: 'SUBSCRIPTION',
          deliveryType: 'MANUAL_CONFIRM',
          status: 'ACTIVE',
          moderationStatus: 'APPROVED',
          currency: 'XTR',
          basePriceAmount: new Prisma.Decimal('150'),
          slaHours: 24,
          refundPolicy: 'Возврат в течение 24ч, если услуга не оказана.',
          tags: ['spotify', 'music', 'subscription'],
          publishedAt: new Date(),
        },
        update: {},
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

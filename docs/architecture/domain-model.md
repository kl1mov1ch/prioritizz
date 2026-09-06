# Domain Model

Полное определение — [`prisma/schema.prisma`](../../prisma/schema.prisma). Здесь — карта.

## Группы сущностей

### Identity

`User` (telegramId, roles[], status) · `Session` (rotating refreshHash, device) ·
`BuyerProfile` · `SellerProfile` (slug, tier, rating agg, payoutMethods, kyc) ·
`AdminUser` (allowlist, totpSecret, passwordHash).

### Catalog

`Category` (self-tree, `commissionRuleId?`) · `Service` (kind, deliveryType,
`basePriceAmount` Decimal, slaHours, refundPolicy, tags[], status,
moderationStatus, `sellerCommissionOverrideBps?`) · `ServiceVariant` ·
`ServiceModeration` (append-only).

### Orders / Escrow

`Order` (reference `PRZ-xxxxxx`, status/paymentStatus/escrowStatus,
`commissionSnapshot` Json immutable, `sellerNetAmount`, `autoReleaseAt`,
`version` optimistic lock) · `OrderEvent` (append-only timeline) ·
`OrderMessage` (чат по заказу) · `EscrowCase` (1:1, held/released/refunded amounts).

### Payments

`PaymentProviderConfig` · `PaymentIntent` (provider, providerRef unique,
clientSecret) · `Transaction` (`@@unique([provider, providerRef, type])` —
защита от дублей callback'ов).

### Ledger (double-entry)

`LedgerAccount` (`@@unique([type, ownerType, ownerId, currency])`, materialized
`balance`) · `LedgerEntry` (groupId, direction, amount>0, `transactionType`).

### Commissions

`CommissionRule` (scope, matcher Json, percentBps, fixed, minFee, maxFee,
priority, activeFrom/To).

### Trust & Support

`Dispute` (reason, status, `slaDueAt`, `version`) · `DisputeMessage`
(`isInternal`) · `DisputeResolution` (outcome, refundAmount) ·
`Review` (1:1 order, rating 1–5, sellerReply) · `SupportTicket` + `TicketMessage`.

### Subscriptions

`SubscriptionPlan` (audience BUYER/SELLER, interval, `perks` Json) ·
`Subscription` (status, currentPeriodEnd, cancelAtPeriodEnd, `version`).

### Promo / Referral (optional)

`PromoCode` · `PromoRedemption` (`@@unique([promoId, userId, orderId])`) ·
`Referral` (referrer/referred 1:1).

### Platform / Ops

`Notification` · `Attachment` (polymorphic ownerType/ownerId, presigned,
`isConfirmed`) · `AuditLog` (before/after Json) · `OutboxEvent` (transactional
outbox) · `IdempotencyKey` (`@@unique([scope, key])`) · `FeatureFlag` ·
`WebhookEndpoint` + `WebhookDelivery`.

## Соглашения

- `id` — cuid. `createdAt` / `updatedAt` везде.
- `deletedAt` (soft delete) — только контент: Category, Service, Review,
  Attachment, SupportTicket. **Финансовые сущности не удаляются никогда.**
- Деньги — `@db.Decimal(20,4)`.
- `version Int` — оптимистичная блокировка на Order, EscrowCase, Dispute,
  Payout, Subscription.
- Все enum'ы дублируют значения из `@prioritizz/constants` (имена идентичны).

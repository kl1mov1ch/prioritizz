/**
 * Canonical enum values shared by Prisma, backend and frontends.
 * Keep in sync with prisma/schema.prisma (names identical).
 */

export const USER_STATUS = ['ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const SELLER_TIER = ['STANDARD', 'PLUS', 'PRO', 'PARTNER'] as const;
export type SellerTier = (typeof SELLER_TIER)[number];

export const SERVICE_KIND = [
  'DIGITAL_SERVICE', // generic internet service / work
  'SUBSCRIPTION', // reselling a subscription / account access
  'TELEGRAM_GIFT', // Telegram gift
  'DIGITAL_GOOD', // keys, codes, files
  'TOP_UP', // balance / wallet top-ups
] as const;
export type ServiceKind = (typeof SERVICE_KIND)[number];

export const DELIVERY_TYPE = [
  'MANUAL_CONFIRM', // buyer confirms receipt
  'AUTO_INSTANT', // payload delivered immediately on payment
  'AUTO_ON_RELEASE', // payload revealed when escrow releases
  'WORKFLOW_DROP', // seller drops result through guarded workflow, buyer accepts
] as const;
export type DeliveryType = (typeof DELIVERY_TYPE)[number];

export const SERVICE_STATUS = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'PAUSED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[number];

export const MODERATION_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'] as const;
export type ModerationStatus = (typeof MODERATION_STATUS)[number];

export const ORDER_STATUS = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'IN_ESCROW',
  'IN_PROGRESS',
  'DELIVERED',
  'COMPLETED',
  'CANCELED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED',
  'CHARGEBACK',
  'EXPIRED',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const PAYMENT_STATUS = [
  'REQUIRES_PAYMENT',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CHARGEBACK',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const ESCROW_STATUS = [
  'NONE',
  'HELD',
  'RELEASE_PENDING',
  'RELEASED',
  'REFUND_PENDING',
  'REFUNDED',
  'SPLIT',
  'FROZEN',
] as const;
export type EscrowStatus = (typeof ESCROW_STATUS)[number];

export const DISPUTE_STATUS = [
  'OPEN',
  'AWAITING_BUYER',
  'AWAITING_SELLER',
  'UNDER_REVIEW',
  'RESOLVED_RELEASE',
  'RESOLVED_REFUND',
  'RESOLVED_SPLIT',
  'REJECTED',
  'CANCELED',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUS)[number];

export const PAYOUT_STATUS = [
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'FAILED',
  'CANCELED',
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUS)[number];

export const SUBSCRIPTION_STATUS = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const SUBSCRIPTION_AUDIENCE = ['BUYER', 'SELLER'] as const;
export type SubscriptionAudience = (typeof SUBSCRIPTION_AUDIENCE)[number];

export const BILLING_INTERVAL = ['MONTH', 'QUARTER', 'YEAR'] as const;
export type BillingInterval = (typeof BILLING_INTERVAL)[number];

export const LEDGER_ACCOUNT_TYPE = [
  'USER_AVAILABLE', // seller/buyer spendable balance
  'USER_PENDING', // funds accrued but not yet releasable
  'ESCROW_HOLD', // per-order held funds
  'PLATFORM_REVENUE', // commissions collected
  'PLATFORM_FEES_PAYABLE',
  'PSP_CLEARING', // money in transit at the payment provider
  'PROMO_LIABILITY',
] as const;
export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPE)[number];

export const LEDGER_DIRECTION = ['DEBIT', 'CREDIT'] as const;
export type LedgerDirection = (typeof LEDGER_DIRECTION)[number];

export const TRANSACTION_TYPE = [
  'CHARGE',
  'REFUND',
  'PAYOUT',
  'COMMISSION',
  'ADJUSTMENT',
  'CHARGEBACK',
  'SUBSCRIPTION_CHARGE',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPE)[number];

export const COMMISSION_SCOPE = [
  'GLOBAL',
  'SERVICE_KIND',
  'CATEGORY',
  'SELLER_TIER',
  'SELLER',
  'PROMO',
] as const;
export type CommissionScope = (typeof COMMISSION_SCOPE)[number];

export const DISPUTE_REASON = [
  'NOT_DELIVERED',
  'NOT_AS_DESCRIBED',
  'PARTIAL_DELIVERY',
  'FRAUD_SUSPECTED',
  'BUYER_UNRESPONSIVE',
  'OTHER',
] as const;
export type DisputeReason = (typeof DISPUTE_REASON)[number];

export const NOTIFICATION_CHANNEL = ['TELEGRAM', 'EMAIL', 'WEBHOOK', 'IN_APP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[number];

export const ATTACHMENT_OWNER = [
  'SERVICE',
  'ORDER',
  'DISPUTE',
  'DISPUTE_MESSAGE',
  'SUPPORT_TICKET',
  'REVIEW',
  'USER',
] as const;
export type AttachmentOwner = (typeof ATTACHMENT_OWNER)[number];

export const TICKET_STATUS = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const CURRENCY = ['XTR', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCY)[number];

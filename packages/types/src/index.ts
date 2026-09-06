/**
 * Domain types for the whole platform.
 * Contract types are DERIVED from @prioritizz/schemas (single source of truth).
 * Only add hand-written types here for things with no runtime schema.
 */
import type { DomainEventName } from '@prioritizz/constants';

export type * from '@prioritizz/schemas';
export type {
  Role,
  Permission,
  UserStatus,
  SellerTier,
  ServiceKind,
  DeliveryType,
  ServiceStatus,
  ModerationStatus,
  OrderStatus,
  PaymentStatus,
  EscrowStatus,
  DisputeStatus,
  PayoutStatus,
  SubscriptionStatus,
  SubscriptionAudience,
  BillingInterval,
  LedgerAccountType,
  LedgerDirection,
  TransactionType,
  CommissionScope,
  DisputeReason,
  NotificationChannel,
  AttachmentOwner,
  TicketStatus,
  Currency,
  QueueName,
  JobName,
  DomainEventName,
  ErrorCode,
} from '@prioritizz/constants';

export type ActorType = 'BUYER' | 'SELLER' | 'ADMIN' | 'SYSTEM';

export interface RequestContext {
  userId: string | null;
  sessionId: string | null;
  roles: string[];
  ip: string | null;
  traceId: string;
}

/** Telegram WebApp initData, parsed. */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user?: TelegramUser;
  auth_date: number;
  query_id?: string;
  start_param?: string;
  hash: string;
}

/** Outbound domain event envelope. */
export interface DomainEventEnvelope<TPayload = unknown> {
  id: string;
  name: DomainEventName;
  payload: TPayload;
  occurredAt: string;
  actor: { type: ActorType; id: string | null };
}

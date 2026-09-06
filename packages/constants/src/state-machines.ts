import type {
  DisputeStatus,
  EscrowStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  SubscriptionStatus,
} from './enums.js';

/**
 * Allowed transitions. The backend state-machine services are the ONLY code
 * permitted to mutate these status fields; every transition emits an AuditLog
 * and a DomainEvent. Frontends use these maps to render available actions.
 */

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELED'],
  PENDING_PAYMENT: ['PAID', 'CANCELED', 'EXPIRED'],
  PAID: ['IN_ESCROW', 'REFUNDED', 'CHARGEBACK'],
  IN_ESCROW: ['IN_PROGRESS', 'DELIVERED', 'DISPUTED', 'REFUNDED', 'CHARGEBACK'],
  IN_PROGRESS: ['DELIVERED', 'DISPUTED', 'REFUNDED', 'CHARGEBACK'],
  DELIVERED: ['COMPLETED', 'DISPUTED', 'REFUNDED', 'CHARGEBACK'],
  COMPLETED: ['DISPUTED', 'CHARGEBACK'],
  DISPUTED: ['COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'IN_ESCROW', 'CHARGEBACK'],
  PARTIALLY_REFUNDED: ['COMPLETED', 'DISPUTED', 'CHARGEBACK'],
  CANCELED: [],
  REFUNDED: ['CHARGEBACK'],
  CHARGEBACK: [],
  EXPIRED: [],
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  REQUIRES_PAYMENT: ['PROCESSING', 'CANCELED', 'FAILED'],
  PROCESSING: ['SUCCEEDED', 'FAILED', 'CANCELED'],
  SUCCEEDED: ['REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK'],
  PARTIALLY_REFUNDED: ['REFUNDED', 'CHARGEBACK'],
  FAILED: ['REQUIRES_PAYMENT'],
  CANCELED: [],
  REFUNDED: ['CHARGEBACK'],
  CHARGEBACK: [],
};

export const ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  NONE: ['HELD'],
  HELD: ['RELEASE_PENDING', 'REFUND_PENDING', 'FROZEN', 'SPLIT'],
  RELEASE_PENDING: ['RELEASED', 'FROZEN'],
  REFUND_PENDING: ['REFUNDED', 'FROZEN'],
  FROZEN: ['RELEASE_PENDING', 'REFUND_PENDING', 'SPLIT'],
  SPLIT: ['RELEASED', 'REFUNDED'],
  RELEASED: [],
  REFUNDED: [],
};

export const DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  OPEN: ['AWAITING_BUYER', 'AWAITING_SELLER', 'UNDER_REVIEW', 'CANCELED'],
  AWAITING_BUYER: ['UNDER_REVIEW', 'AWAITING_SELLER', 'CANCELED'],
  AWAITING_SELLER: ['UNDER_REVIEW', 'AWAITING_BUYER', 'CANCELED'],
  UNDER_REVIEW: ['RESOLVED_RELEASE', 'RESOLVED_REFUND', 'RESOLVED_SPLIT', 'REJECTED'],
  RESOLVED_RELEASE: [],
  RESOLVED_REFUND: [],
  RESOLVED_SPLIT: [],
  REJECTED: [],
  CANCELED: [],
};

export const PAYOUT_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED', 'CANCELED'],
  APPROVED: ['PROCESSING', 'CANCELED'],
  PROCESSING: ['PAID', 'FAILED'],
  FAILED: ['PROCESSING', 'CANCELED'],
  PAID: [],
  REJECTED: [],
  CANCELED: [],
};

export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIALING: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  ACTIVE: ['PAST_DUE', 'CANCELED', 'EXPIRED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: ['ACTIVE'],
  EXPIRED: ['ACTIVE'],
};

export function canTransition<T extends string>(map: Record<T, T[]>, from: T, to: T): boolean {
  return map[from]?.includes(to) ?? false;
}

/** Domain events. Persisted to OutboxEvent, then published to the bus. */
export const DOMAIN_EVENTS = {
  USER_REGISTERED: 'user.registered',
  SELLER_ONBOARDED: 'seller.onboarded',

  SERVICE_SUBMITTED: 'service.submitted',
  SERVICE_APPROVED: 'service.approved',
  SERVICE_REJECTED: 'service.rejected',

  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_ESCROWED: 'order.escrowed',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELED: 'order.canceled',
  ORDER_EXPIRED: 'order.expired',
  ORDER_MESSAGE_POSTED: 'order.message.posted',

  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  PAYMENT_CHARGEBACK: 'payment.chargeback',

  ESCROW_HELD: 'escrow.held',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_REFUNDED: 'escrow.refunded',
  ESCROW_SPLIT: 'escrow.split',

  DISPUTE_OPENED: 'dispute.opened',
  DISPUTE_MESSAGE_ADDED: 'dispute.message_added',
  DISPUTE_RESOLVED: 'dispute.resolved',

  PAYOUT_REQUESTED: 'payout.requested',
  PAYOUT_APPROVED: 'payout.approved',
  PAYOUT_PAID: 'payout.paid',

  SUBSCRIPTION_STARTED: 'subscription.started',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',

  REVIEW_CREATED: 'review.created',
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

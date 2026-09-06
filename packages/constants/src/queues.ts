/** BullMQ queue names. Prefixed at runtime with BULLMQ_PREFIX. */
export const QUEUES = {
  PAYMENTS: 'payments',
  ESCROW_TIMERS: 'escrow-timers',
  PAYOUTS: 'payouts',
  NOTIFICATIONS: 'notifications',
  SUBSCRIPTIONS: 'subscriptions',
  DISPUTES_SLA: 'disputes-sla',
  ANALYTICS_ROLLUP: 'analytics-rollup',
  OUTBOX_DISPATCH: 'outbox-dispatch',
  WEBHOOKS_OUTBOUND: 'webhooks-outbound',
  GIFT_DELIVERY: 'gift-delivery',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const JOBS = {
  ESCROW_AUTO_RELEASE: 'escrow.auto-release',
  ORDER_PAYMENT_EXPIRE: 'order.payment-expire',
  DISPUTE_SLA_ESCALATE: 'dispute.sla-escalate',
  SUBSCRIPTION_RENEW: 'subscription.renew',
  SUBSCRIPTION_EXPIRE: 'subscription.expire',
  NOTIFICATION_SEND: 'notification.send',
  PAYOUT_PROCESS: 'payout.process',
  OUTBOX_FLUSH: 'outbox.flush',
  ANALYTICS_DAILY: 'analytics.daily',
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

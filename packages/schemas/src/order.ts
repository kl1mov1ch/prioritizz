import { z } from 'zod';
import { ESCROW_STATUS, ORDER_STATUS, PAYMENT_STATUS } from '@prioritizz/constants';
import {
  currencySchema,
  idSchema,
  moneySchema,
  paginationQuerySchema,
  timestampsSchema,
} from './common.js';

export const createOrderSchema = z.object({
  serviceId: idSchema,
  variantId: idSchema.optional(),
  quantity: z.number().int().min(1).default(1),
  buyerNote: z.string().max(2000).optional(),
  promoCode: z.string().max(40).optional(),
  // client-supplied inputs required by some services (e.g. account login, target @username)
  fields: z.record(z.string(), z.string().max(2000)).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const commissionSnapshotSchema = z.object({
  ruleId: idSchema.nullable(),
  scope: z.string(),
  percentBps: z.number().int(),
  fixed: moneySchema,
  minFee: moneySchema,
  computedFee: moneySchema,
  sellerNetAmount: moneySchema,
  premiumDiscountBps: z.number().int().default(0),
});
export type CommissionSnapshot = z.infer<typeof commissionSnapshotSchema>;

export const orderSchema = z.object({
  id: idSchema,
  reference: z.string(), // human-friendly PRZ-XXXX
  status: z.enum(ORDER_STATUS),
  paymentStatus: z.enum(PAYMENT_STATUS),
  escrowStatus: z.enum(ESCROW_STATUS),
  currency: currencySchema,
  quantity: z.number().int(),
  grossAmount: moneySchema,
  discountAmount: moneySchema,
  totalAmount: moneySchema,
  commissionSnapshot: commissionSnapshotSchema,
  sellerNetAmount: moneySchema,
  autoReleaseAt: z.string().datetime().nullable(),
  buyer: z.object({ id: idSchema, displayName: z.string() }),
  seller: z.object({ id: idSchema, displayName: z.string() }),
  service: z.object({
    id: idSchema,
    title: z.string(),
    kind: z.string(),
    deliveryType: z.string(),
  }),
  buyerNote: z.string().nullable(),
  deliveryPayload: z.string().nullable(), // revealed per delivery rules
  ...timestampsSchema.shape,
});
export type Order = z.infer<typeof orderSchema>;

export const orderEventSchema = z.object({
  id: idSchema,
  type: z.string(),
  fromStatus: z.string().nullable(),
  toStatus: z.string().nullable(),
  actorType: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SYSTEM']),
  actorId: idSchema.nullable(),
  message: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type OrderEvent = z.infer<typeof orderEventSchema>;

export const orderListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['buyer', 'seller']).default('buyer'),
  status: z.enum(ORDER_STATUS).optional(),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

// ---- actions ----
export const orderDeliverSchema = z.object({
  payload: z.string().max(8000).optional(),
  attachmentIds: z.array(idSchema).max(10).default([]),
  note: z.string().max(2000).optional(),
});
export type OrderDeliverInput = z.infer<typeof orderDeliverSchema>;

export const orderConfirmSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().max(2000).optional(),
});
export type OrderConfirmInput = z.infer<typeof orderConfirmSchema>;

export const orderCancelSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const orderMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  attachmentIds: z.array(idSchema).max(5).default([]),
});
export type OrderMessageInput = z.infer<typeof orderMessageSchema>;

// ---- payment intent ----
export const createPaymentIntentSchema = z.object({
  orderId: idSchema,
  provider: z.string(), // must be in enabled PAYMENT_PROVIDERS
  returnUrl: z.string().url().optional(),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const paymentIntentSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  provider: z.string(),
  status: z.enum(PAYMENT_STATUS),
  amount: moneySchema,
  currency: currencySchema,
  clientSecret: z.string().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).nullable(),
  expiresAt: z.string().datetime().nullable(),
});
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;

import { z } from 'zod';
import {
  BILLING_INTERVAL,
  SUBSCRIPTION_AUDIENCE,
  SUBSCRIPTION_STATUS,
} from '@prioritizz/constants';
import { currencySchema, idSchema, moneySchema, timestampsSchema } from './common.js';

export const subscriptionPerksSchema = z.object({
  commissionDiscountBps: z.number().int().min(0).max(10_000).default(0),
  maxActiveListings: z.number().int().nullable().default(null),
  prioritySupport: z.boolean().default(false),
  featuredPlacement: z.boolean().default(false),
  reducedPayoutDelayHours: z.number().int().nullable().default(null),
  buyerCashbackBps: z.number().int().min(0).max(10_000).default(0),
});
export type SubscriptionPerks = z.infer<typeof subscriptionPerksSchema>;

export const subscriptionPlanUpsertSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(2).max(60),
  audience: z.enum(SUBSCRIPTION_AUDIENCE),
  priceAmount: moneySchema,
  currency: currencySchema,
  interval: z.enum(BILLING_INTERVAL),
  trialDays: z.number().int().min(0).default(0),
  perks: subscriptionPerksSchema,
  isActive: z.boolean().default(true),
});
export type SubscriptionPlanUpsertInput = z.infer<typeof subscriptionPlanUpsertSchema>;

export const subscriptionPlanSchema = subscriptionPlanUpsertSchema
  .extend({ id: idSchema })
  .merge(timestampsSchema);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscribeSchema = z.object({
  planId: idSchema,
  provider: z.string(),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const subscriptionSchema = z.object({
  id: idSchema,
  plan: subscriptionPlanSchema.pick({
    id: true,
    code: true,
    name: true,
    audience: true,
    interval: true,
    perks: true,
  }),
  status: z.enum(SUBSCRIPTION_STATUS),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  ...timestampsSchema.shape,
});
export type Subscription = z.infer<typeof subscriptionSchema>;

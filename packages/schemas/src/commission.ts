import { z } from 'zod';
import { COMMISSION_SCOPE, SELLER_TIER, SERVICE_KIND } from '@prioritizz/constants';
import { idSchema, moneySchema, timestampsSchema } from './common.js';

/** Matcher narrows which orders a rule applies to. All present fields must match. */
export const commissionMatcherSchema = z.object({
  serviceKind: z.enum(SERVICE_KIND).optional(),
  categoryId: idSchema.optional(),
  sellerTier: z.enum(SELLER_TIER).optional(),
  sellerId: idSchema.optional(),
  promoCode: z.string().optional(),
});
export type CommissionMatcher = z.infer<typeof commissionMatcherSchema>;

export const commissionRuleUpsertSchema = z.object({
  name: z.string().min(3).max(80),
  scope: z.enum(COMMISSION_SCOPE),
  matcher: commissionMatcherSchema,
  percentBps: z.number().int().min(0).max(10_000),
  fixed: moneySchema.default('0'),
  minFee: moneySchema.default('0'),
  maxFee: moneySchema.nullable().optional(),
  priority: z.number().int().default(100), // lower wins on ties
  isActive: z.boolean().default(true),
  activeFrom: z.string().datetime().nullable().optional(),
  activeTo: z.string().datetime().nullable().optional(),
});
export type CommissionRuleUpsertInput = z.infer<typeof commissionRuleUpsertSchema>;

export const commissionRuleSchema = commissionRuleUpsertSchema
  .extend({ id: idSchema })
  .merge(timestampsSchema);
export type CommissionRule = z.infer<typeof commissionRuleSchema>;

export const commissionPreviewSchema = z.object({
  grossAmount: moneySchema,
  currency: z.string(),
  serviceId: idSchema,
});
export const commissionPreviewResultSchema = z.object({
  appliedRuleId: idSchema.nullable(),
  scope: z.string(),
  percentBps: z.number().int(),
  fixed: moneySchema,
  computedFee: moneySchema,
  sellerNetAmount: moneySchema,
  premiumDiscountBps: z.number().int(),
});
export type CommissionPreviewResult = z.infer<typeof commissionPreviewResultSchema>;

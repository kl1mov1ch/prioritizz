import { z } from 'zod';
import { PAYOUT_STATUS } from '@prioritizz/constants';
import {
  currencySchema,
  idSchema,
  moneySchema,
  paginationQuerySchema,
  timestampsSchema,
} from './common.js';

export const payoutMethodSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TELEGRAM_STARS'), handle: z.string().min(1) }),
  z.object({ type: z.literal('CRYPTO'), asset: z.string(), address: z.string().min(10) }),
  z.object({ type: z.literal('CARD'), maskedPan: z.string(), token: z.string() }),
]);
export type PayoutMethod = z.infer<typeof payoutMethodSchema>;

export const requestPayoutSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
  method: payoutMethodSchema,
});
export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

export const payoutSchema = z.object({
  id: idSchema,
  reference: z.string(),
  sellerId: idSchema,
  amount: moneySchema,
  currency: currencySchema,
  feeAmount: moneySchema,
  netAmount: moneySchema,
  status: z.enum(PAYOUT_STATUS),
  method: payoutMethodSchema,
  providerRef: z.string().nullable(),
  failureReason: z.string().nullable(),
  approvedByAdminId: idSchema.nullable(),
  ...timestampsSchema.shape,
});
export type Payout = z.infer<typeof payoutSchema>;

export const payoutListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PAYOUT_STATUS).optional(),
  sellerId: idSchema.optional(),
});

export const adminPayoutDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
});
export type AdminPayoutDecisionInput = z.infer<typeof adminPayoutDecisionSchema>;

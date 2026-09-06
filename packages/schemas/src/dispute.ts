import { z } from 'zod';
import { DISPUTE_REASON, DISPUTE_STATUS } from '@prioritizz/constants';
import { idSchema, moneySchema, paginationQuerySchema, timestampsSchema } from './common.js';

export const openDisputeSchema = z.object({
  orderId: idSchema,
  reason: z.enum(DISPUTE_REASON),
  description: z.string().min(10).max(4000),
  desiredOutcome: z.enum(['REFUND', 'REDELIVERY', 'PARTIAL_REFUND']),
  requestedAmount: moneySchema.optional(), // for PARTIAL_REFUND
  attachmentIds: z.array(idSchema).max(10).default([]),
});
export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;

export const disputeMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  attachmentIds: z.array(idSchema).max(10).default([]),
});
export type DisputeMessageInput = z.infer<typeof disputeMessageSchema>;

export const resolveDisputeSchema = z
  .object({
    outcome: z.enum(['RELEASE', 'REFUND', 'SPLIT', 'REJECT']),
    refundAmount: moneySchema.optional(), // required for SPLIT / partial REFUND
    rationale: z.string().min(5).max(2000),
    penalizeSeller: z.boolean().default(false),
  })
  .refine((v) => v.outcome !== 'SPLIT' || !!v.refundAmount, {
    message: 'refundAmount is required for SPLIT',
    path: ['refundAmount'],
  });
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

export const disputeSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  orderReference: z.string(),
  status: z.enum(DISPUTE_STATUS),
  reason: z.enum(DISPUTE_REASON),
  description: z.string(),
  desiredOutcome: z.string(),
  requestedAmount: moneySchema.nullable(),
  openedByType: z.enum(['BUYER', 'SELLER']),
  slaDueAt: z.string().datetime().nullable(),
  resolution: z
    .object({
      outcome: z.string(),
      refundAmount: moneySchema.nullable(),
      rationale: z.string(),
      resolvedByAdminId: idSchema.nullable(),
      resolvedAt: z.string().datetime(),
    })
    .nullable(),
  ...timestampsSchema.shape,
});
export type Dispute = z.infer<typeof disputeSchema>;

export const disputeListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(DISPUTE_STATUS).optional(),
  overdue: z.coerce.boolean().optional(),
});
export type DisputeListQuery = z.infer<typeof disputeListQuerySchema>;

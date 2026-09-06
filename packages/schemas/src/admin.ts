import { z } from 'zod';
import { idSchema, paginationQuerySchema } from './common.js';

export const dashboardMetricsSchema = z.object({
  range: z.enum(['24h', '7d', '30d', '90d']),
  gmv: z.string(),
  revenue: z.string(),
  ordersCount: z.number().int(),
  completedOrders: z.number().int(),
  activeDisputes: z.number().int(),
  pendingPayouts: z.number().int(),
  pendingModeration: z.number().int(),
  newUsers: z.number().int(),
  activeSellers: z.number().int(),
  disputeRate: z.number(),
  refundRate: z.number(),
  series: z.array(
    z.object({ date: z.string(), gmv: z.string(), orders: z.number().int(), revenue: z.string() }),
  ),
});
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const auditLogQuerySchema = paginationQuerySchema.extend({
  actorId: idSchema.optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: idSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const auditLogSchema = z.object({
  id: idSchema,
  actorType: z.enum(['ADMIN', 'USER', 'SYSTEM']),
  actorId: idSchema.nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  ip: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const featureFlagSchema = z.object({
  key: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  payload: z.record(z.string(), z.unknown()).nullable(),
  updatedAt: z.string().datetime(),
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

export const featureFlagUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const manualLedgerAdjustmentSchema = z.object({
  userId: idSchema,
  direction: z.enum(['CREDIT', 'DEBIT']),
  amount: z.string(),
  currency: z.string(),
  reason: z.string().min(10).max(1000),
  linkedOrderId: idSchema.optional(),
});
export type ManualLedgerAdjustmentInput = z.infer<typeof manualLedgerAdjustmentSchema>;

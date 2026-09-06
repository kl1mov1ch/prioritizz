import { z } from 'zod';
import {
  DELIVERY_TYPE,
  MODERATION_STATUS,
  SERVICE_KIND,
  SERVICE_STATUS,
} from '@prioritizz/constants';
import {
  currencySchema,
  idSchema,
  moneySchema,
  paginationQuerySchema,
  timestampsSchema,
} from './common.js';

export const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: idSchema,
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    parentId: idSchema.nullable(),
    order: z.number().int(),
    isActive: z.boolean(),
    children: z.array(categorySchema).optional(),
  }),
);
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  children?: Category[];
};

/** Lightweight category reference embedded in Service payloads. */
export const categoryRefSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
});
export type CategoryRef = z.infer<typeof categoryRefSchema>;

export const serviceVariantInputSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1).max(80),
  priceAmount: moneySchema,
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
  stock: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const serviceUpsertSchema = z.object({
  title: z.string().min(4).max(120),
  summary: z.string().min(10).max(300),
  description: z.string().min(20).max(8000),
  kind: z.enum(SERVICE_KIND),
  deliveryType: z.enum(DELIVERY_TYPE),
  categoryId: idSchema,
  currency: currencySchema,
  basePriceAmount: moneySchema,
  slaHours: z
    .number()
    .int()
    .min(0)
    .max(24 * 30),
  refundPolicy: z.string().max(2000),
  terms: z.string().max(4000).optional(),
  tags: z.array(z.string().min(1).max(24)).max(15).default([]),
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().min(1).default(1),
  perBuyerLimit: z.number().int().min(0).default(0), // 0 = unlimited
  autoModeration: z.boolean().default(true),
  sellerCommissionOverrideBps: z.number().int().min(0).max(10_000).nullable().optional(),
  variants: z.array(serviceVariantInputSchema).max(30).default([]),
  attachmentIds: z.array(idSchema).max(10).default([]),
});
export type ServiceUpsertInput = z.infer<typeof serviceUpsertSchema>;

export const serviceListQuerySchema = paginationQuerySchema.extend({
  categoryId: idSchema.optional(),
  kind: z.enum(SERVICE_KIND).optional(),
  deliveryType: z.enum(DELIVERY_TYPE).optional(),
  sellerId: idSchema.optional(),
  minPrice: moneySchema.optional(),
  maxPrice: moneySchema.optional(),
  status: z.enum(SERVICE_STATUS).optional(),
  tag: z.string().optional(),
});
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

export const serviceSchema = z.object({
  id: idSchema,
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  kind: z.enum(SERVICE_KIND),
  deliveryType: z.enum(DELIVERY_TYPE),
  status: z.enum(SERVICE_STATUS),
  moderationStatus: z.enum(MODERATION_STATUS),
  category: categoryRefSchema,
  currency: currencySchema,
  basePriceAmount: moneySchema,
  slaHours: z.number().int(),
  refundPolicy: z.string(),
  terms: z.string().nullable(),
  tags: z.array(z.string()),
  minQuantity: z.number().int(),
  maxQuantity: z.number().int(),
  ratingAvg: z.number(),
  ratingCount: z.number().int(),
  seller: z.object({
    id: idSchema,
    displayName: z.string(),
    tier: z.string(),
    ratingAvg: z.number(),
    isVerified: z.boolean(),
  }),
  variants: z.array(serviceVariantInputSchema.extend({ id: idSchema, priceAmount: moneySchema })),
  media: z.array(z.object({ id: idSchema, url: z.string().url(), kind: z.string() })),
  ...timestampsSchema.shape,
});
export type Service = z.infer<typeof serviceSchema>;

export const moderationDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'ESCALATED']),
  note: z.string().max(1000).optional(),
});
export type ModerationDecisionInput = z.infer<typeof moderationDecisionSchema>;

export const categoryUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
  icon: z.string().max(64).optional(),
  parentId: idSchema.nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  commissionRuleId: idSchema.nullable().optional(),
});
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

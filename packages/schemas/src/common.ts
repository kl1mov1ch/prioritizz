import { z } from 'zod';
import { CURRENCY, ERROR_CODES } from '@prioritizz/constants';

/** cuid-ish id — Prisma default. Kept loose on purpose. */
export const idSchema = z.string().min(8).max(64);

/** Money as a fixed-point string. NEVER a JS number in transit. */
export const moneySchema = z
  .string()
  .regex(/^-?\d{1,15}(\.\d{1,4})?$/, 'must be a decimal string with up to 4 fraction digits');

export const currencySchema = z.enum(CURRENCY);

export const moneyAmountSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(), // e.g. "createdAt:desc"
  q: z.string().trim().max(200).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

export const apiErrorSchema = z.object({
  code: z.enum(Object.values(ERROR_CODES) as [string, ...string[]]),
  message: z.string(),
  details: z.unknown().optional(),
  traceId: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const idempotencyHeaderSchema = z.object({
  'idempotency-key': z.string().uuid().optional(),
});

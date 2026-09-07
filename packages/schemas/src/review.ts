import { z } from 'zod';
import { idSchema, paginationQuerySchema, paginatedSchema } from './common.js';

export const createReviewSchema = z.object({
  orderId: idSchema,
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const sellerReplySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});
export type SellerReplyInput = z.infer<typeof sellerReplySchema>;

export const reviewSchema = z.object({
  id: idSchema,
  serviceId: idSchema,
  sellerId: idSchema,
  rating: z.number().int(),
  text: z.string().nullable(),
  sellerReply: z.string().nullable(),
  author: z.object({
    name: z.string(),
    photoUrl: z.string().nullable(),
  }),
  createdAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewListQuerySchema = paginationQuerySchema.extend({
  serviceId: idSchema.optional(),
  sellerId: idSchema.optional(),
});
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

export const reviewPageSchema = paginatedSchema(reviewSchema);

/** Aggregate rating breakdown for a service or seller header. */
export const ratingSummarySchema = z.object({
  average: z.number(),
  count: z.number().int(),
  /** Buckets 1..5 → how many reviews. */
  histogram: z.record(z.string(), z.number().int()),
});
export type RatingSummary = z.infer<typeof ratingSummarySchema>;

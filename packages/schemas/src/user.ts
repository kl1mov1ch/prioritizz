import { z } from 'zod';
import { SELLER_TIER, USER_STATUS } from '@prioritizz/constants';
import { idSchema, moneySchema, timestampsSchema } from './common.js';
import { authUserSchema } from './auth.js';

export const userProfileSchema = authUserSchema.merge(timestampsSchema).extend({
  buyerProfile: z
    .object({
      completedOrders: z.number().int(),
      disputeRate: z.number(),
      premiumUntil: z.string().datetime().nullable(),
    })
    .nullable(),
  sellerProfile: z
    .object({
      id: idSchema,
      displayName: z.string(),
      tier: z.enum(SELLER_TIER),
      ratingAvg: z.number(),
      ratingCount: z.number().int(),
      completedOrders: z.number().int(),
      isVerified: z.boolean(),
      premiumUntil: z.string().datetime().nullable(),
    })
    .nullable(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateMeSchema = z.object({
  languageCode: z.string().min(2).max(8).optional(),
  contactEmail: z.string().email().optional(),
  notificationPrefs: z
    .object({
      telegram: z.boolean(),
      email: z.boolean(),
    })
    .partial()
    .optional(),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const becomeSellerSchema = z.object({
  displayName: z.string().min(2).max(60),
  about: z.string().max(1000).optional(),
  contactHandle: z.string().max(64).optional(),
  acceptTerms: z.literal(true),
});
export type BecomeSellerInput = z.infer<typeof becomeSellerSchema>;

export const walletSummarySchema = z.object({
  currency: z.string(),
  available: moneySchema,
  pending: moneySchema,
  inEscrow: moneySchema,
  lifetimeEarned: moneySchema,
  lifetimeSpent: moneySchema,
});
export type WalletSummary = z.infer<typeof walletSummarySchema>;

// admin-side user update
export const adminUpdateUserSchema = z.object({
  status: z.enum(USER_STATUS).optional(),
  rolesAdd: z.array(z.string()).optional(),
  rolesRemove: z.array(z.string()).optional(),
  reason: z.string().min(3).max(500),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

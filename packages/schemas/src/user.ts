import { z } from 'zod';
import { SELLER_TIER, USER_STATUS } from '@prioritizz/constants';
import { idSchema, moneySchema, timestampsSchema } from './common.js';
import { authUserSchema } from './auth.js';

/** Notification channel + per-event toggles. All optional; unset means default-on. */
export const notificationPrefsSchema = z
  .object({
    telegram: z.boolean(),
    email: z.boolean(),
    orderUpdates: z.boolean(),
    chatMessages: z.boolean(),
    marketing: z.boolean(),
  })
  .partial();
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export const userProfileSchema = authUserSchema.merge(timestampsSchema).extend({
  contactEmail: z.string().email().nullable(),
  notificationPrefs: notificationPrefsSchema,
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
  /** Display-name overrides — Telegram values seed these, the user can change them. */
  firstName: z.string().trim().min(1).max(64).optional(),
  lastName: z.string().trim().max(64).nullable().optional(),
  languageCode: z.string().min(2).max(8).optional(),
  contactEmail: z.string().email().nullable().optional(),
  /** Confirmed USER-owned attachment id to use as the avatar. Null clears it. */
  avatarAttachmentId: idSchema.nullable().optional(),
  notificationPrefs: z
    .object({
      telegram: z.boolean(),
      email: z.boolean(),
      orderUpdates: z.boolean(),
      chatMessages: z.boolean(),
      marketing: z.boolean(),
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

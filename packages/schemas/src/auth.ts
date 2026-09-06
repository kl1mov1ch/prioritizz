import { z } from 'zod';
import { ROLES, USER_STATUS } from '@prioritizz/constants';
import { idSchema } from './common.js';

/** Raw initData string as handed to us by Telegram.WebApp. */
export const telegramInitDataSchema = z.object({
  initData: z.string().min(1),
});
export type TelegramInitDataInput = z.infer<typeof telegramInitDataSchema>;

export const authUserSchema = z.object({
  id: idSchema,
  telegramId: z.string(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  languageCode: z.string().nullable(),
  roles: z.array(z.enum(Object.values(ROLES) as [string, ...string[]])),
  status: z.enum(USER_STATUS),
  isSeller: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  refreshTokenExpiresAt: z.string().datetime(),
});
export type TokenPair = z.infer<typeof tokenPairSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  tokens: tokenPairSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const adminLoginSchema = z
  .object({
    initData: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    totp: z.string().length(6).optional(),
  })
  .refine((v) => v.initData || (v.email && v.password), {
    message: 'Provide Telegram initData or email + password',
  });
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** Shape of a verified JWT access-token payload. */
export const jwtAccessPayloadSchema = z.object({
  sub: idSchema,
  sid: idSchema, // session id
  roles: z.array(z.string()),
  typ: z.literal('access'),
});
export type JwtAccessPayload = z.infer<typeof jwtAccessPayloadSchema>;

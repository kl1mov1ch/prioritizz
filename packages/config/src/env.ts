import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { config as loadDotenvFile } from 'dotenv';
import { z } from 'zod';

/**
 * Hydrate process.env from the nearest .env walking up from `startDir`.
 * Existing variables always win, so real environment config (Docker, CI,
 * the shell) is never overridden by a checked-out file.
 *
 * Nest apps get this from ConfigModule; standalone processes (bot, scripts,
 * workers) call it explicitly before loadEnv().
 */
export function loadDotenv(startDir: string = process.cwd()): string | null {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      loadDotenvFile({ path: candidate, override: false, quiet: true });
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Single source of truth for backend runtime configuration.
 * `loadEnv()` throws on boot if anything is missing or malformed — fail fast.
 */

const csv = (v: string | undefined): string[] =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_MODE: z.enum(['http', 'worker']).default('http'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  API_GLOBAL_PREFIX: z.string().default('api'),
  CORS_ORIGINS: z
    .string()
    .transform(csv)
    .pipe(z.array(z.string()))
    .default('http://localhost:5173'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BULLMQ_PREFIX: z.string().default('prioritizz'),

  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),
  INITDATA_MAX_AGE_SEC: z.coerce.number().int().positive().default(86_400),

  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_BOT_USERNAME: z.string().default('PrioritizzBot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8).default('dev_webhook_secret_change_me'),
  /** Relay base URL for the Bot API when api.telegram.org is blocked (e.g. a
   *  Cloudflare Worker proxy). Empty → talk to Telegram directly. */
  TELEGRAM_API_ROOT: z.string().url().optional(),
  /** Optional outbound proxy for Bot API calls: socks5://host:port or http://host:port. */
  TELEGRAM_PROXY: z.string().optional(),
  MINI_APP_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_PANEL_URL: z.string().url().default('http://localhost:5174'),
  /** BotFather → Login Widget. Client id equals the bot id; secret powers OIDC. */
  TELEGRAM_LOGIN_CLIENT_ID: z.string().optional(),
  TELEGRAM_LOGIN_SECRET: z.string().optional(),
  ADMIN_TELEGRAM_ALLOWLIST: z.string().transform(csv).pipe(z.array(z.string())).default(''),

  PLATFORM_CURRENCY: z.enum(['XTR', 'USD', 'EUR']).default('XTR'),
  DEFAULT_COMMISSION_BPS: z.coerce.number().int().min(0).max(10_000).default(1000),
  DEFAULT_MIN_FEE: z.coerce.number().min(0).default(1),
  ESCROW_AUTO_RELEASE_HOURS: z.coerce.number().int().positive().default(72),
  DISPUTE_SLA_HOURS: z.coerce.number().int().positive().default(48),

  PAYMENT_PROVIDERS: z.string().transform(csv).pipe(z.array(z.string())).default('telegram_stars'),
  CRYPTOPAY_API_TOKEN: z.string().optional(),
  CRYPTOPAY_WEBHOOK_SECRET: z.string().optional(),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_PUBLIC_URL: z.string().url(),

  SMTP_URL: z.string().default('smtp://localhost:1025'),
  MAIL_FROM: z.string().default('no-reply@prioritizz.local'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

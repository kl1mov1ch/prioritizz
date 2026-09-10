/**
 * ATTACK: Telegram identity verification (auth/telegram-init-data.service.ts).
 *
 * These run the REAL service with a test bot token, forging payloads the way a
 * client would, to probe the verifier's edges.
 */
import { createHash, createHmac } from 'node:crypto';
import { describe, it, expect, beforeAll } from 'vitest';
import { TelegramInitDataService } from '../../src/modules/auth/telegram-init-data.service';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN';

function env() {
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  process.env.DATABASE_URL ??= 'postgresql://x:x@localhost:5432/x';
  process.env.REDIS_URL ??= 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET ??= 'x'.repeat(32);
  process.env.JWT_REFRESH_SECRET ??= 'y'.repeat(32);
  process.env.S3_ENDPOINT ??= 'http://localhost:9000';
  process.env.S3_BUCKET ??= 'b';
  process.env.S3_ACCESS_KEY_ID ??= 'a';
  process.env.S3_SECRET_ACCESS_KEY ??= 's';
  process.env.S3_PUBLIC_URL ??= 'http://localhost:9000/b';
}

function signWidget(fields: Record<string, string | number>): Record<string, unknown> {
  const secret = createHash('sha256').update(BOT_TOKEN).digest();
  const dcs = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const hash = createHmac('sha256', secret).update(dcs).digest('hex');
  return { ...fields, hash };
}

describe('F-11 Login Widget verifier — forgeability & edges', () => {
  let svc: TelegramInitDataService;
  beforeAll(() => {
    env();
    svc = new TelegramInitDataService();
  });

  it('anyone who can compute HMAC with the bot token forges a valid identity', () => {
    // Confirms the trust boundary: possession of TELEGRAM_BOT_TOKEN == ability
    // to mint any user (incl. arbitrary id / username) for /v1/auth/telegram/widget.
    const payload = signWidget({
      id: 999999,
      first_name: 'Mallory',
      username: 'victim_handle',
      auth_date: Math.floor(Date.now() / 1000),
    });
    const u = svc.verifyLoginWidget(payload as Record<string, unknown>);
    expect(u.id).toBe(999999);
    expect(u.username).toBe('victim_handle');
  });

  it('a non-hex hash is rejected cleanly (Buffer.from(hex) truncation path)', () => {
    expect(() =>
      svc.verifyLoginWidget({ id: 1, first_name: 'x', auth_date: Math.floor(Date.now() / 1000), hash: 'nothex!!' }),
    ).toThrow(/signature mismatch/);
  });

  it('a valid signature with a far-future auth_date is accepted (no clock-skew ceiling)', () => {
    const future = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
    const payload = signWidget({ id: 7, first_name: 'Future', auth_date: future });
    const u = svc.verifyLoginWidget(payload as Record<string, unknown>);
    expect(u.id).toBe(7); // ageSec is negative -> passes the "too old" check
  });
});

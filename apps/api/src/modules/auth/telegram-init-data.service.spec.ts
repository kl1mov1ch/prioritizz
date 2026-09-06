import { createHmac } from 'node:crypto';
import { describe, expect, it, beforeAll } from 'vitest';
import { TelegramInitDataService } from './telegram-init-data.service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '123456:TEST';

/** Build a signed initData string exactly as Telegram would. */
function signInitData(fields: Record<string, string>): string {
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const dcs = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const hash = createHmac('sha256', secret).update(dcs).digest('hex');
  const p = new URLSearchParams(fields);
  p.set('hash', hash);
  return p.toString();
}

describe('TelegramInitDataService', () => {
  let svc: TelegramInitDataService;

  beforeAll(() => {
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
    svc = new TelegramInitDataService();
  });

  it('accepts a correctly signed, fresh payload', () => {
    const initData = signInitData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: 'AAA',
      user: JSON.stringify({ id: 42, first_name: 'Ada' }),
    });
    const parsed = svc.verify(initData);
    expect(parsed.user?.id).toBe(42);
  });

  it('rejects a tampered payload', () => {
    const initData = signInitData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: JSON.stringify({ id: 42, first_name: 'Ada' }),
    }).replace('Ada', 'Eve');
    expect(() => svc.verify(initData)).toThrow(/signature mismatch/);
  });

  it('rejects a stale payload', () => {
    const initData = signInitData({
      auth_date: String(Math.floor(Date.now() / 1000) - 999_999),
      user: JSON.stringify({ id: 1, first_name: 'Old' }),
    });
    expect(() => svc.verify(initData)).toThrow(/too old/);
  });
});

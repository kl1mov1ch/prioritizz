/**
 * Black-box HTTP attack suite as vitest assertions.
 *
 * Needs a RUNNING API. Point it at one and run:
 *   ATTACK_TARGET=http://localhost:3000 \
 *     node_modules/.bin/vitest run --config security-tests/vitest.config.ts e2e
 *
 * Without ATTACK_TARGET the whole file is skipped (so CI stays green).
 */
import { describe, it, expect } from 'vitest';

const TARGET = process.env.ATTACK_TARGET?.replace(/\/+$/, '');
const PREFIX = process.env.ATTACK_PREFIX ?? 'api';
const d = TARGET ? describe : describe.skip;

async function req(method: string, path: string, init: RequestInit & { json?: unknown } = {}) {
  const url = `${TARGET}/${PREFIX}${path}`;
  const headers = new Headers(init.headers);
  let body = init.body;
  if (init.json !== undefined) {
    body = JSON.stringify(init.json);
    headers.set('content-type', 'application/json');
  }
  const res = await fetch(url, { ...init, method, headers, body, redirect: 'manual' });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

d('unauthenticated access is refused with 401 (never 200/500)', () => {
  for (const p of [
    '/v1/me',
    '/v1/me/wallet',
    '/v1/orders',
    '/v1/me/payouts',
    '/v1/auth/sessions',
    '/v1/admin/dashboard',
    '/v1/admin/users',
    '/v1/admin/audit-logs',
    '/v1/admin/payouts',
  ]) {
    it(`GET ${p} -> 401`, async () => {
      const r = await req('GET', p);
      expect(r.status, r.text.slice(0, 200)).toBe(401);
    });
  }
});

d('forged / malformed bearer tokens -> 401, no stack trace', () => {
  const tokens = [
    'Bearer ',
    'Bearer null',
    'Bearer a.b.c',
    // alg:none forged admin token
    'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbi1hYWFhYSIsInNpZCI6InNpZC1hYWFhYSIsInJvbGVzIjpbIlNVUEVSQURNSU4iXSwidHlwIjoiYWNjZXNzIn0.',
    'Bearer ../../../../etc/passwd',
  ];
  for (const t of tokens) {
    it(`token "${t.slice(0, 20)}" -> 401`, async () => {
      const r = await req('GET', '/v1/me', { headers: { authorization: t } });
      expect(r.status).toBe(401);
      expect(r.text.toLowerCase()).not.toContain('stack');
      expect(r.text).not.toMatch(/at .*\(.*\.ts:\d+/);
    });
  }
});

d('payment webhook rejects missing / wrong / default shared secret', () => {
  for (const secret of [undefined, 'wrong', 'dev_webhook_secret_change_me']) {
    it(`secret=${secret ?? 'none'} -> 4xx`, async () => {
      const r = await req('POST', '/v1/webhooks/telegram/payment', {
        headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {},
        json: { payload: 'probe', charge_id: 'x' },
      });
      expect([400, 401, 403]).toContain(r.status);
    });
  }
});

d('input handling', () => {
  it('malformed JSON -> 400/422, not 500', async () => {
    const r = await req('POST', '/v1/auth/telegram', {
      body: '{oops',
      headers: { 'content-type': 'application/json' },
    });
    expect([400, 422]).toContain(r.status);
  });
  it('type-confused field -> 422', async () => {
    const r = await req('POST', '/v1/auth/telegram', { json: { initData: { $ne: 1 } } });
    expect([400, 422]).toContain(r.status);
  });
});

d('CORS does not reflect an arbitrary Origin under credentials', () => {
  it('OPTIONS with Origin: https://evil.example', async () => {
    const r = await req('OPTIONS', '/v1/me', {
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });
    const acao = r.headers.get('access-control-allow-origin');
    expect(acao).not.toBe('https://evil.example');
    expect(acao).not.toBe('*');
  });
});

d('rate limiting', () => {
  it('spoofed X-Forwarded-For rotation should still get throttled eventually', async () => {
    let limited = 0;
    for (let i = 0; i < 160; i++) {
      const r = await req('GET', '/healthz', { headers: { 'x-forwarded-for': `10.9.${i >> 8}.${i & 255}` } });
      if (r.status === 429) limited++;
    }
    // Documents the finding: if this is 0, the limiter trusts a spoofable header.
    expect(limited, 'no 429s across 160 spoofed IPs — throttler is bypassable').toBeGreaterThan(0);
  });
});

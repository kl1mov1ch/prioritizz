#!/usr/bin/env node
/**
 * Black-box attacker for a RUNNING Prioritizz API.
 *
 *   TARGET=http://localhost:3000 node security-tests/live/attack.mjs
 *
 * It never needs credentials. It probes the auth boundary, error handling,
 * enumeration, rate-limit evasion, CORS and header tampering, and writes
 * security-tests/results/live-report.{json,md}.
 *
 * Nothing here is destructive: only GET / OPTIONS and deliberately-malformed
 * POSTs that must be rejected before any state changes.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET = (process.env.TARGET ?? 'http://localhost:3000').replace(/\/+$/, '');
const PREFIX = process.env.API_PREFIX ?? 'api';
const BASE = `${TARGET}/${PREFIX}`;
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'results');
mkdirSync(outDir, { recursive: true });

const results = [];
const rec = (name, severity, expected, got, note) =>
  results.push({ name, severity, expected, got, verdict: pass(expected, got) ? 'OK' : 'REVIEW', note });

function pass(expected, got) {
  if (typeof expected === 'function') return expected(got);
  if (Array.isArray(expected)) return expected.includes(got);
  return expected === got;
}

async function hit(method, path, { headers = {}, body, raw } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const init = { method, headers: { ...headers }, redirect: 'manual' };
  if (body !== undefined) {
    init.body = raw ? body : JSON.stringify(body);
    init.headers['content-type'] = init.headers['content-type'] ?? 'application/json';
  }
  const t0 = Date.now();
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return { status: res.status, ms: Date.now() - t0, headers: Object.fromEntries(res.headers), text };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, headers: {}, text: String(e) };
  }
}

const AUTHED_GET = [
  '/v1/me',
  '/v1/me/wallet',
  '/v1/me/notifications',
  '/v1/orders',
  '/v1/me/payouts',
  '/v1/auth/sessions',
];
const ADMIN_GET = [
  '/v1/admin/dashboard',
  '/v1/admin/users',
  '/v1/admin/audit-logs',
  '/v1/admin/feature-flags',
  '/v1/admin/payouts',
  '/v1/admin/disputes',
];

async function run() {
  // ---- 1. unauthenticated access to protected routes -> must be 401 ----
  for (const p of AUTHED_GET) {
    const r = await hit('GET', p);
    rec(`no-auth ${p}`, 'CRITICAL', [401], r.status, `body: ${r.text.slice(0, 120)}`);
  }
  for (const p of ADMIN_GET) {
    const r = await hit('GET', p);
    rec(`no-auth ${p}`, 'CRITICAL', [401], r.status, `body: ${r.text.slice(0, 120)}`);
  }

  // ---- 2. malformed / forged bearer tokens -> 401, never 500 ----
  for (const tok of [
    'Bearer ',
    'Bearer null',
    'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInNpZCI6IngiLCJyb2xlcyI6WyJTVVBFUkFETUlOIl0sInR5cCI6ImFjY2VzcyJ9.',
    'Bearer ../../etc/passwd',
    'Basic YWRtaW46YWRtaW4=',
  ]) {
    const r = await hit('GET', '/v1/me', { headers: { authorization: tok } });
    rec(`forged token "${tok.slice(0, 24)}..."`, 'HIGH', (s) => s === 401, r.status, r.text.slice(0, 120));
  }

  // ---- 3. error-handling: bad JSON, wrong content-type, oversized ----
  {
    const r = await hit('POST', '/v1/auth/telegram', { body: '{bad json', raw: true });
    rec('malformed JSON body', 'MEDIUM', (s) => s === 400 || s === 422, r.status, r.text.slice(0, 160));
  }
  {
    const r = await hit('POST', '/v1/auth/telegram', { body: { initData: 123 } });
    rec('type-confused initData', 'MEDIUM', (s) => s === 422 || s === 400, r.status, r.text.slice(0, 160));
  }
  {
    const r = await hit('POST', '/v1/auth/refresh', { body: { refreshToken: 'x'.repeat(100000) } });
    rec('huge refreshToken', 'LOW', (s) => [400, 401, 413, 422].includes(s), r.status, `${r.text.slice(0, 80)}`);
  }

  // ---- 4. Telegram payment webhook without / with wrong secret -> must reject ----
  for (const secret of [undefined, 'wrong', 'dev_webhook_secret_change_me']) {
    const r = await hit('POST', '/v1/webhooks/telegram/payment', {
      headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {},
      body: { payload: 'intent_probe', charge_id: 'x' },
    });
    rec(`payment webhook secret=${secret ?? 'none'}`, 'CRITICAL', (s) => s === 400 || s === 401 || s === 403, r.status, r.text.slice(0, 140));
  }

  // ---- 5. rate-limit / throttler evasion via X-Forwarded-For rotation ----
  {
    const N = 200;
    let ok = 0, limited = 0;
    for (let i = 0; i < N; i++) {
      const r = await hit('GET', '/healthz', { headers: { 'x-forwarded-for': `10.0.${i >> 8}.${i & 255}` } });
      if (r.status === 429) limited++; else ok++;
    }
    rec('throttler bypass via XFF rotation (200 req)', 'MEDIUM', () => limited > 0, `${ok} ok / ${limited} x429`,
      'if 0 x429, the per-IP limiter trusts a spoofable client header');
  }
  {
    const N = 200;
    let limited = 0;
    for (let i = 0; i < N; i++) {
      const r = await hit('GET', '/healthz');
      if (r.status === 429) limited++;
    }
    rec('throttler active on a single IP (200 req / <60s)', 'INFO', () => limited > 0, `${limited} x429`,
      'baseline: limit is 120/60s');
  }

  // ---- 6. CORS reflection ----
  {
    const r = await hit('OPTIONS', '/v1/me', {
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });
    const acao = r.headers['access-control-allow-origin'];
    rec('CORS reflects arbitrary Origin', 'MEDIUM', () => acao !== 'https://evil.example' && acao !== '*',
      acao ?? '(none)', 'with credentials:true a reflected/`*` ACAO is exploitable');
  }

  // ---- 7. docs / debug surface ----
  for (const p of ['/api/docs', '/api/docs-json', '/api']) {
    const r = await hit('GET', p.replace('/api', `/${PREFIX}`));
    rec(`swagger surface ${p}`, 'LOW', (s) => s === 404, r.status, 'exposed only when NODE_ENV!=production');
  }

  // ---- 8. HTTP method tampering on a mutating route ----
  {
    const r = await hit('GET', '/v1/payments/intents/anything');
    rec('GET payment intent w/o auth', 'HIGH', (s) => s === 401, r.status, r.text.slice(0, 120));
  }

  const summary = {
    target: BASE,
    when: new Date().toISOString(),
    totals: {
      checks: results.length,
      review: results.filter((r) => r.verdict === 'REVIEW').length,
      ok: results.filter((r) => r.verdict === 'OK').length,
    },
    results,
  };
  writeFileSync(join(outDir, 'live-report.json'), JSON.stringify(summary, null, 2));
  writeFileSync(
    join(outDir, 'live-report.md'),
    [
      `# Live black-box run — ${summary.when}`,
      `Target: \`${BASE}\``,
      ``,
      `| Verdict | Severity | Check | Expected | Got | Note |`,
      `|---|---|---|---|---|---|`,
      ...results.map(
        (r) =>
          `| ${r.verdict === 'OK' ? '✅' : '⚠️'} | ${r.severity} | ${r.name} | ${fmt(r.expected)} | ${fmt(r.got)} | ${r.note ?? ''} |`,
      ),
      ``,
      `**${summary.totals.review} checks need review, ${summary.totals.ok} OK, of ${summary.totals.checks}.**`,
    ].join('\n'),
  );
  console.log(`\n${summary.totals.review} REVIEW / ${summary.totals.ok} OK / ${summary.totals.checks} checks`);
  console.table(results.map((r) => ({ verdict: r.verdict, sev: r.severity, check: r.name, got: fmt(r.got) })));
}

function fmt(v) {
  if (typeof v === 'function') return '(predicate)';
  if (Array.isArray(v)) return v.join('|');
  return String(v).replace(/\|/g, '/').slice(0, 60);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

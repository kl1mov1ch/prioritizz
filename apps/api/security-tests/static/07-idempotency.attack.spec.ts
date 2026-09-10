/**
 * ATTACK: IdempotencyInterceptor request-hash behaviour
 * (common/interceptors/idempotency.interceptor.ts).
 *
 *   requestHash = sha256(JSON.stringify({ body, params, query }))
 *
 * Two consequences worth pinning:
 *  1. Key + a *different* payload  -> IDEMPOTENCY_KEY_REUSED (correct).
 *  2. Key + the *same* payload but a different JSON key ORDER -> different hash
 *     -> the client is wrongly told "reused with a different payload".
 *     JSON.stringify is order-sensitive; clients / proxies can reorder JSON.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

const hash = (o: unknown) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

describe('F-15 idempotency hash is JSON-key-order sensitive', () => {
  it('same logical body, different key order => different requestHash', () => {
    const a = hash({ body: { orderId: 'o1', provider: 'mock' }, params: {}, query: {} });
    const b = hash({ body: { provider: 'mock', orderId: 'o1' }, params: {}, query: {} });
    expect(a).not.toBe(b); // interceptor would raise IDEMPOTENCY_KEY_REUSED
  });

  it('query string variations under the same key also flip the hash', () => {
    const a = hash({ body: {}, params: {}, query: { a: '1', b: '2' } });
    const b = hash({ body: {}, params: {}, query: { b: '2', a: '1' } });
    expect(a).not.toBe(b);
  });
});

describe('F-16 idempotency success-write is fire-and-forget', () => {
  it('documents the race: completedAt/responseBody update is not awaited', () => {
    // See interceptor: tap({ next: (body) => void this.prisma.idempotencyKey.update(...) })
    // If that write is lost, the row stays { completedAt: null } forever and
    // every retry with the same key gets CONFLICT "Duplicate request in progress".
    expect(true).toBe(true);
  });
});

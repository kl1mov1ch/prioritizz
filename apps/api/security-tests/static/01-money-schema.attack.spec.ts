/**
 * ATTACK SURFACE: request-body validation for monetary amounts.
 *
 * `moneySchema` (packages/schemas/src/common.ts) is used for:
 *   - requestPayoutSchema.amount            (POST /v1/payouts)
 *   - resolveDisputeSchema.refundAmount     (POST /v1/admin/disputes/:id/resolve)
 *   - openDisputeSchema.requestedAmount     (POST /v1/disputes)
 *   - manualLedgerAdjustmentSchema.amount   (admin finance)
 *
 * These tests assert the CURRENT behaviour so regressions are visible. A
 * failing expectation here means the schema was hardened (good).
 */
import { describe, it, expect } from 'vitest';
import {
  requestPayoutSchema,
  resolveDisputeSchema,
  openDisputeSchema,
  manualLedgerAdjustmentSchema,
} from '@prioritizz/schemas';

describe('F-01 moneySchema accepts negative amounts', () => {
  it('payout request accepts a negative amount (defence is downstream only)', () => {
    const r = requestPayoutSchema.safeParse({
      amount: '-100.00',
      currency: 'XTR',
      method: { type: 'TELEGRAM_STARS', handle: '@x' },
    });
    expect(r.success).toBe(true); // <-- schema does NOT reject it
  });

  it('dispute resolution accepts a negative refundAmount', () => {
    const r = resolveDisputeSchema.safeParse({
      outcome: 'REFUND',
      refundAmount: '-1',
      rationale: 'attacker controlled',
    });
    expect(r.success).toBe(true);
  });

  it('open dispute accepts a negative requestedAmount', () => {
    const r = openDisputeSchema.safeParse({
      orderId: 'order_1234',
      reason: 'NOT_DELIVERED',
      description: 'x'.repeat(20),
      desiredOutcome: 'PARTIAL_REFUND',
      requestedAmount: '-999999',
    });
    expect(r.success).toBe(true);
  });

  it('manual ledger adjustment accepts a negative amount and 15-digit whale amount', () => {
    for (const amount of ['-500', '999999999999999.9999']) {
      const r = manualLedgerAdjustmentSchema.safeParse({
        userId: 'user_1234',
        direction: 'CREDIT',
        amount,
        currency: 'XTR',
        reason: 'bulk credit test',
      });
      expect(r.success).toBe(true);
    }
  });
});

describe('F-02 moneySchema accepts zero and unbounded magnitude', () => {
  it('accepts "0" and "0.0000"', () => {
    expect(requestPayoutSchema.safeParse({
      amount: '0',
      currency: 'XTR',
      method: { type: 'TELEGRAM_STARS', handle: '@x' },
    }).success).toBe(true);
  });

  it('accepts a 15-integer-digit amount (~1e15) with no upper bound', () => {
    expect(requestPayoutSchema.safeParse({
      amount: '999999999999999',
      currency: 'XTR',
      method: { type: 'TELEGRAM_STARS', handle: '@x' },
    }).success).toBe(true);
  });
});

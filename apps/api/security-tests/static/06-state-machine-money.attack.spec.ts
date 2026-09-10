/**
 * ATTACK: order state-machine transitions that touch money
 * (packages/constants/src/state-machines.ts).
 *
 * The state machine is permissive on purpose; the ONLY thing stopping a second
 * fund movement is a status string check inside each service method. These
 * tests pin the transitions an attacker would try to abuse.
 */
import { describe, it, expect } from 'vitest';
import { ORDER_TRANSITIONS, PAYOUT_TRANSITIONS, canTransition } from '@prioritizz/constants';

describe('F-12 COMPLETED order can still transition to DISPUTED at the SM level', () => {
  it('ORDER_TRANSITIONS allows COMPLETED -> DISPUTED', () => {
    expect(canTransition(ORDER_TRANSITIONS, 'COMPLETED', 'DISPUTED')).toBe(true);
  });
  it('DISPUTED can then go to REFUNDED / PARTIALLY_REFUNDED', () => {
    expect(canTransition(ORDER_TRANSITIONS, 'DISPUTED', 'REFUNDED')).toBe(true);
    expect(canTransition(ORDER_TRANSITIONS, 'DISPUTED', 'PARTIALLY_REFUNDED')).toBe(true);
  });
  it('=> a dispute reopened after release relies solely on DisputesService.DISPUTABLE and escrow loadHeld() guards', () => {
    // DisputesService.open() rejects non-[IN_ESCROW,IN_PROGRESS,DELIVERED];
    // escrow.loadHeld() rejects RELEASED/REFUNDED escrow. If either check is
    // ever loosened, COMPLETED->DISPUTED->REFUNDED double-pays the buyer.
    expect(canTransition(ORDER_TRANSITIONS, 'COMPLETED', 'DISPUTED')).toBe(true);
  });
});

describe('F-13 REFUNDED / CHARGEBACK are near-terminal', () => {
  it('REFUNDED -> CHARGEBACK is allowed (only)', () => {
    expect(ORDER_TRANSITIONS.REFUNDED).toEqual(['CHARGEBACK']);
  });
});

describe('F-14 payout has no PAID -> * recovery path', () => {
  it('PAID is terminal — a wrongly-approved payout cannot be reversed via the SM', () => {
    expect(PAYOUT_TRANSITIONS.PAID).toEqual([]);
  });
});

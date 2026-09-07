import type { Step, StepState } from '@prioritizz/ui';

type Msg = (k: string) => string;

/** Linear happy path; terminal negative states replace the tail. */
const FLOW = ['created', 'paid', 'escrow', 'delivered', 'completed'] as const;

const REACHED_BY: Record<string, number> = {
  DRAFT: 0,
  PENDING_PAYMENT: 0,
  PAID: 1,
  IN_ESCROW: 2,
  IN_PROGRESS: 2,
  DELIVERED: 3,
  COMPLETED: 4,
};

/**
 * Builds the progress rail for an order. The step matching the current status
 * is `current` (it pulses), earlier ones `done`, later ones `upcoming`.
 * Canceled / refunded / disputed collapse to a single failed step.
 */
export function orderSteps(status: string, t: Msg): Step[] {
  if (status === 'CANCELED' || status === 'EXPIRED') {
    return [{ key: 'canceled', label: t('orders.steps.canceled'), state: 'failed' }];
  }
  if (status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') {
    return [{ key: 'refunded', label: t('orders.steps.refunded'), state: 'failed' }];
  }
  if (status === 'DISPUTED' || status === 'CHARGEBACK') {
    return [{ key: 'disputed', label: t('orders.steps.disputed'), state: 'failed' }];
  }

  const reached = REACHED_BY[status] ?? 0;
  return FLOW.map((key, i) => {
    const state: StepState = i < reached ? 'done' : i === reached ? 'current' : 'upcoming';
    return { key, label: t(`orders.steps.${key}`), state };
  });
}

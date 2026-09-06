/** Display helpers shared by both frontends. Money stays a string end-to-end. */

const CURRENCY_LABEL: Record<string, string> = { XTR: '★', USD: '$', EUR: '€' };

export function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  const symbol = CURRENCY_LABEL[currency] ?? currency;
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: currency === 'XTR' ? 0 : 2 })
    : amount;
  return currency === 'XTR' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

type Tone = 'secondary' | 'info' | 'success' | 'warning' | 'destructive' | 'purple';

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'secondary',
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  IN_ESCROW: 'info',
  IN_PROGRESS: 'info',
  DELIVERED: 'warning',
  COMPLETED: 'success',
  CANCELED: 'secondary',
  REFUNDED: 'destructive',
  PARTIALLY_REFUNDED: 'warning',
  DISPUTED: 'destructive',
  CHARGEBACK: 'destructive',
  EXPIRED: 'secondary',
};

export function statusTone(status: string) {
  return STATUS_TONE[status] ?? 'secondary';
}

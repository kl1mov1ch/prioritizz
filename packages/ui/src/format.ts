/** Display helpers shared by both frontends. Money stays a string end-to-end. */

const CURRENCY_LABEL: Record<string, string> = {
  XTR: '★',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  USDT: '₮',
};
/** Currencies rendered with no fraction digits. */
const ZERO_DP = new Set(['XTR', 'RUB']);

export function formatMoney(amount: string, currency: string, locale?: string): string {
  const n = Number(amount);
  const symbol = CURRENCY_LABEL[currency] ?? currency;
  const dp = ZERO_DP.has(currency) ? 0 : 2;
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp })
    : amount;
  // Symbol trails for crypto/stars/ruble, leads for USD/EUR.
  return currency === 'USD' || currency === 'EUR'
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`;
}

/** Pass the app locale so dates don't silently follow the browser instead. */
export function formatDateTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Localised relative time via Intl — no more hardcoded "5m ago". */
export function timeAgo(iso: string, locale?: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const secs = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(secs);
  if (abs < 45) return rtf.format(Math.round(secs), 'second');
  if (abs < 2700) return rtf.format(Math.round(secs / 60), 'minute');
  if (abs < 79200) return rtf.format(Math.round(secs / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(secs / 86400), 'day');
  if (abs < 31104000) return rtf.format(Math.round(secs / 2592000), 'month');
  return rtf.format(Math.round(secs / 31104000), 'year');
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

export type { Tone };

export function statusTone(status: string) {
  return STATUS_TONE[status] ?? 'secondary';
}

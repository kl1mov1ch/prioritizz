import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { inTelegram, openInvoice, notify } from './telegram';

export type PayPhase = 'idle' | 'creating' | 'awaiting' | 'confirming' | 'done' | 'error';

/**
 * Drives an order from PENDING_PAYMENT to paid.
 *
 *  · inside Telegram → `telegram_stars`: create an invoice link, open the
 *    native payment sheet, then poll the order until the bot's
 *    successful_payment webhook has flipped it to SUCCEEDED.
 *  · outside Telegram (local dev) → `mock`: the API captures immediately.
 */
export function usePayOrder() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<PayPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  async function pay(orderId: string): Promise<boolean> {
    setError(null);
    const provider = inTelegram() ? 'telegram_stars' : 'mock';
    try {
      setPhase('creating');
      const intent = await api.payments.createIntent({ orderId, provider }, crypto.randomUUID());

      if (provider === 'mock' || intent.status === 'SUCCEEDED') {
        setPhase('done');
        notify('success');
        await qc.invalidateQueries({ queryKey: ['order', orderId] });
        return true;
      }

      // telegram_stars: open the invoice, then wait for the webhook to catch up.
      setPhase('awaiting');
      const status = await openInvoice(intent.clientSecret ?? '');
      if (status !== 'paid') {
        setPhase('idle');
        if (status === 'failed') setError('Оплата не прошла');
        return false;
      }

      setPhase('confirming');
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const order = await api.orders.get(orderId);
        if (order.paymentStatus === 'SUCCEEDED' || order.status !== 'PENDING_PAYMENT') {
          setPhase('done');
          notify('success');
          await qc.invalidateQueries({ queryKey: ['order', orderId] });
          return true;
        }
      }
      // Paid on Telegram's side but the webhook is slow — treat as success and
      // let the order page's own polling reconcile.
      setPhase('done');
      await qc.invalidateQueries({ queryKey: ['order', orderId] });
      return true;
    } catch (e) {
      setPhase('error');
      setError((e as Error).message);
      notify('error');
      return false;
    }
  }

  return { pay, phase, error, busy: ['creating', 'awaiting', 'confirming'].includes(phase) };
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  GroupedList,
  GroupedRow,
  LoadingState,
  RatingInput,
  Sheet,
  Stepper,
  Textarea,
  Timeline,
  formatMoney,
  formatDateTime,
  statusTone,
  IconChat,
} from '@prioritizz/ui';
import { useI18n, useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { orderSteps } from '../lib/order-steps';
import { haptic, notify } from '../lib/telegram';

export default function OrderPage() {
  const t = useT();
  const { locale } = useI18n();
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.orders.get(id),
    // A webhook can move the status while the page is open.
    refetchInterval: (q) =>
      ['COMPLETED', 'CANCELED', 'REFUNDED', 'EXPIRED'].includes(
        (q.state.data as { status?: string } | undefined)?.status ?? '',
      )
        ? false
        : 15_000,
  });
  const timeline = useQuery({
    queryKey: ['order', id, 'events'],
    queryFn: () => api.orders.timeline(id),
  });

  const confirm = useMutation({
    mutationFn: (body: { rating?: number; reviewText?: string }) => api.orders.confirm(id, body),
    onSuccess: () => {
      notify('success');
      setRateOpen(false);
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  if (order.isLoading) return <LoadingState label={t('common.loading')} />;
  if (order.isError || !order.data)
    return (
      <ErrorState
        title={t('common.somethingWrong')}
        onRetry={() => order.refetch()}
        retryLabel={t('common.retry')}
      />
    );

  const o = order.data;
  const steps = orderSteps(o.status, t as (k: string) => string);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-mono text-title2 font-semibold">{o.reference}</h1>
        <Badge variant={statusTone(o.status)}>
          {t(`orders.steps.${stepKey(o.status)}` as never)}
        </Badge>
      </div>

      {/* Animated progress rail — the "status tracking" the buyer watches. */}
      <Card>
        <Stepper steps={steps} />
      </Card>

      <Card flush className="overflow-hidden">
        <div className="flex items-center gap-3 px-4 pb-3 pt-4 md:px-5">
          <p className="min-w-0 flex-1 truncate text-body font-semibold">{o.service.title}</p>
          <Link to={`/orders/${o.id}/chat`}>
            <Button size="sm" variant="grouped">
              <IconChat size={15} />
              {t('orders.openChat')}
            </Button>
          </Link>
        </div>
        <GroupedList className="rounded-none bg-transparent">
          <GroupedRow>
            <span className="text-subhead text-muted">{t('orders.amount')}</span>
            <span className="text-body font-semibold">
              {formatMoney(o.totalAmount, o.currency, locale)}
            </span>
          </GroupedRow>
          {o.autoReleaseAt && (
            <GroupedRow>
              <span className="text-subhead text-muted">{t('orders.autoConfirm')}</span>
              <span className="text-subhead">{formatDateTime(o.autoReleaseAt, locale)}</span>
            </GroupedRow>
          )}
        </GroupedList>
      </Card>

      {o.deliveryPayload && (
        <Card className="space-y-2">
          <p className="text-footnote font-semibold text-muted">{t('orders.result')}</p>
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-grouped p-3 font-mono text-footnote">
            {o.deliveryPayload}
          </pre>
        </Card>
      )}

      {o.status === 'DELIVERED' && (
        <Button
          size="block"
          onClick={() => {
            haptic('medium');
            setRateOpen(true);
          }}
        >
          {t('orders.confirmReceipt')}
        </Button>
      )}

      <Card className="space-y-3">
        <p className="text-footnote font-semibold text-muted">{t('orders.history')}</p>
        <Timeline
          entries={(timeline.data ?? []).map((e) => ({
            id: e.id,
            title: `${e.type}${e.toStatus ? ` → ${e.toStatus}` : ''}`,
            hint: formatDateTime(e.createdAt, locale),
          }))}
        />
      </Card>

      <Sheet
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        title={t('orders.rateTitle')}
        closeLabel={t('common.cancel')}
        footer={
          <div className="flex gap-3">
            <Button
              variant="grouped"
              className="flex-1"
              loading={confirm.isPending && !confirm.variables?.rating}
              onClick={() => confirm.mutate({})}
            >
              {t('orders.skipRating')}
            </Button>
            <Button
              className="flex-1"
              disabled={rating === 0}
              loading={confirm.isPending && !!confirm.variables?.rating}
              onClick={() => confirm.mutate({ rating, reviewText: reviewText.trim() || undefined })}
            >
              {t('orders.confirmAndRate')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <p className="text-footnote text-subtle">{t('orders.rateHint')}</p>
          <div className="flex justify-center">
            <RatingInput value={rating} onChange={setRating} label={t('orders.rateTitle')} />
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            placeholder={t('orders.reviewPlaceholder')}
          />
        </div>
      </Sheet>
    </div>
  );
}

function stepKey(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'created',
    DRAFT: 'created',
    PAID: 'paid',
    IN_ESCROW: 'escrow',
    IN_PROGRESS: 'escrow',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
    EXPIRED: 'canceled',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'refunded',
    DISPUTED: 'disputed',
    CHARGEBACK: 'disputed',
  };
  return map[status] ?? 'created';
}

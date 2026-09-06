import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  formatMoney,
  formatDateTime,
  statusTone,
  IconCheck,
  IconClock,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';

export default function OrderPage() {
  const t = useT();
  const { id = '' } = useParams();
  const qc = useQueryClient();

  const order = useQuery({ queryKey: ['order', id], queryFn: () => api.orders.get(id) });
  const timeline = useQuery({
    queryKey: ['order', id, 'events'],
    queryFn: () => api.orders.timeline(id),
  });

  const confirm = useMutation({
    mutationFn: () => api.orders.confirm(id, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg font-bold">{o.reference}</h1>
        <Badge variant={statusTone(o.status)}>{o.status}</Badge>
      </div>

      <Card className="space-y-3">
        <p className="font-semibold">{o.service.title}</p>
        <dl className="space-y-2 text-sm">
          <Row k={t('orders.amount')} v={formatMoney(o.totalAmount, o.currency)} strong />
          <Row k={t('orders.payment')} v={o.paymentStatus} />
          <Row k={t('orders.escrow')} v={o.escrowStatus} />
          {o.autoReleaseAt && (
            <Row k={t('orders.autoConfirm')} v={formatDateTime(o.autoReleaseAt)} />
          )}
        </dl>
      </Card>

      {o.deliveryPayload && (
        <Card className="space-y-1.5">
          <p className="text-sm font-semibold">{t('orders.result')}</p>
          <pre className="whitespace-pre-wrap break-all rounded-xl bg-[hsl(var(--glass-bg))] p-3 text-xs">
            {o.deliveryPayload}
          </pre>
        </Card>
      )}

      {o.status === 'DELIVERED' && (
        <Button size="block" loading={confirm.isPending} onClick={() => confirm.mutate()}>
          <IconCheck size={17} /> {t('orders.confirmReceipt')}
        </Button>
      )}

      <Card className="space-y-3">
        <p className="text-sm font-semibold">{t('orders.history')}</p>
        <ol className="space-y-3">
          {(timeline.data ?? []).map((e) => (
            <li key={e.id} className="flex gap-3 text-xs">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[hsl(var(--glass-bg))] text-muted-foreground">
                <IconClock size={12} />
              </span>
              <div className="text-muted-foreground">
                <span className="font-mono">{formatDateTime(e.createdAt)}</span>
                <br />
                <span className="text-foreground">{e.type}</span>
                {e.toStatus ? ` → ${e.toStatus}` : ''}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={strong ? 'text-base font-bold' : 'font-medium'}>{v}</dd>
    </div>
  );
}

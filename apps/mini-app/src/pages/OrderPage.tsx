import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  GroupedList,
  GroupedRow,
  LoadingState,
  formatMoney,
  formatDateTime,
  statusTone,
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-mono text-title2 font-semibold">{o.reference}</h1>
        <Badge variant={statusTone(o.status)}>{o.status}</Badge>
      </div>

      <Card flush className="overflow-hidden">
        <div className="px-4 pb-3 pt-4 md:px-5">
          <p className="text-body font-semibold">{o.service.title}</p>
        </div>
        <GroupedList className="rounded-none bg-transparent">
          <GroupedRow>
            <span className="text-subhead text-muted">{t('orders.amount')}</span>
            <span className="text-body font-semibold">
              {formatMoney(o.totalAmount, o.currency)}
            </span>
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead text-muted">{t('orders.payment')}</span>
            <span className="text-subhead">{o.paymentStatus}</span>
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead text-muted">{t('orders.escrow')}</span>
            <span className="text-subhead">{o.escrowStatus}</span>
          </GroupedRow>
          {o.autoReleaseAt && (
            <GroupedRow>
              <span className="text-subhead text-muted">{t('orders.autoConfirm')}</span>
              <span className="text-subhead">{formatDateTime(o.autoReleaseAt)}</span>
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
        <Button size="block" loading={confirm.isPending} onClick={() => confirm.mutate()}>
          {t('orders.confirmReceipt')}
        </Button>
      )}

      <Card className="space-y-3">
        <p className="text-footnote font-semibold text-muted">{t('orders.history')}</p>
        <ol className="relative space-y-4 border-l border-separator pl-4">
          {(timeline.data ?? []).map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
              <p className="text-footnote font-medium">
                {e.type}
                {e.toStatus ? ` → ${e.toStatus}` : ''}
              </p>
              <p className="font-mono text-caption text-subtle">{formatDateTime(e.createdAt)}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

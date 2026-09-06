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
} from '@prioritizz/ui';
import { api } from '../lib/api';

export default function OrderPage() {
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

  if (order.isLoading) return <LoadingState />;
  if (order.isError || !order.data) return <ErrorState onRetry={() => order.refetch()} />;

  const o = order.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{o.reference}</h1>
        <Badge variant={statusTone(o.status)}>{o.status}</Badge>
      </div>

      <Card className="p-4">
        <p className="font-medium">{o.service.title}</p>
        <dl className="mt-2 space-y-1 text-sm">
          <Row k="Сумма" v={formatMoney(o.totalAmount, o.currency)} />
          <Row k="Оплата" v={o.paymentStatus} />
          <Row k="Гарантия (escrow)" v={o.escrowStatus} />
          {o.autoReleaseAt && <Row k="Авто-подтверждение" v={formatDateTime(o.autoReleaseAt)} />}
        </dl>
      </Card>

      {o.deliveryPayload && (
        <Card className="p-4">
          <p className="text-sm font-medium">Результат</p>
          <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
            {o.deliveryPayload}
          </pre>
        </Card>
      )}

      {o.status === 'DELIVERED' && (
        <Button size="block" loading={confirm.isPending} onClick={() => confirm.mutate()}>
          Подтвердить получение
        </Button>
      )}

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">История</p>
        <ol className="space-y-2">
          {(timeline.data ?? []).map((e) => (
            <li key={e.id} className="text-xs text-muted-foreground">
              <span className="font-mono">{formatDateTime(e.createdAt)}</span> — {e.type}
              {e.toStatus ? ` → ${e.toStatus}` : ''}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

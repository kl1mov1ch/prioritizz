import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  EmptyState,
  LoadingState,
  formatMoney,
  statusTone,
  timeAgo,
} from '@prioritizz/ui';
import { api } from '../lib/api';

export default function OrdersPage() {
  const orders = useQuery({
    queryKey: ['orders', 'buyer'],
    queryFn: () => api.orders.list({ role: 'buyer', pageSize: 30 }),
  });

  if (orders.isLoading) return <LoadingState />;
  if (!orders.data?.items.length)
    return <EmptyState title="Пока нет сделок" description="Выберите услугу в каталоге." />;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Мои сделки</h1>
      {orders.data.items.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`}>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{o.service.title}</span>
              <Badge variant={statusTone(o.status)}>{o.status}</Badge>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{o.reference}</span>
              <span>{timeAgo(o.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm font-semibold">{formatMoney(o.totalAmount, o.currency)}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

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
  IconReceipt,
  IconArrowRight,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';

export default function OrdersPage() {
  const t = useT();
  const orders = useQuery({
    queryKey: ['orders', 'buyer'],
    queryFn: () => api.orders.list({ role: 'buyer', pageSize: 30 }),
  });

  if (orders.isLoading) return <LoadingState label={t('common.loading')} />;
  if (!orders.data?.items.length)
    return (
      <EmptyState
        title={t('orders.emptyTitle')}
        description={t('orders.emptyDesc')}
        icon={<IconReceipt size={22} />}
      />
    );

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold tracking-tight">{t('orders.myDeals')}</h1>
      {orders.data.items.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="group block">
          <Card className="p-4 transition-transform duration-200 group-active:scale-[0.985]">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{o.service.title}</span>
              <Badge variant={statusTone(o.status)}>{o.status}</Badge>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">{o.reference}</span>
              <span>{timeAgo(o.createdAt)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-bold">{formatMoney(o.totalAmount, o.currency)}</span>
              <IconArrowRight
                size={16}
                className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

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
  IconChevronRight,
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

  return (
    <div className="space-y-4">
      <h1 className="title-large">{t('orders.myDeals')}</h1>

      {!orders.data?.items.length ? (
        <EmptyState
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDesc')}
          icon={<IconReceipt size={22} />}
        />
      ) : (
        <ul className="space-y-3">
          {orders.data.items.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="group block">
                <Card className="transition-transform duration-150 group-active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="truncate text-body font-semibold">{o.service.title}</span>
                    <Badge variant={statusTone(o.status)}>{o.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-caption text-subtle">
                    <span className="font-mono">{o.reference}</span>
                    <span aria-hidden>·</span>
                    <span>{timeAgo(o.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-title3 font-semibold">
                      {formatMoney(o.totalAmount, o.currency)}
                    </span>
                    <IconChevronRight
                      size={16}
                      className="text-subtle transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

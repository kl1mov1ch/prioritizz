import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';

const RANGES = ['24h', '7d', '30d', '90d'] as const;

export default function DashboardPage() {
  const t = useT();
  const [range, setRange] = useState<(typeof RANGES)[number]>('7d');
  const q = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api.admin.dashboard(range),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.dashboard')}</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded border px-2 py-1 text-xs ${r === range ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading && <LoadingState label={t('common.loading')} />}
      {q.isError && <ErrorState title={t('common.somethingWrong')} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label={t('admin.gmv')} value={q.data.gmv} />
          <Metric label={t('admin.revenue')} value={q.data.revenue} />
          <Metric label={t('admin.ordersCount')} value={String(q.data.ordersCount)} />
          <Metric label={t('admin.completed')} value={String(q.data.completedOrders)} />
          <Metric label={t('admin.activeDisputes')} value={String(q.data.activeDisputes)} />
          <Metric label={t('admin.pendingPayouts')} value={String(q.data.pendingPayouts)} />
          <Metric label={t('admin.pendingModeration')} value={String(q.data.pendingModeration)} />
          <Metric label={t('admin.newUsers')} value={String(q.data.newUsers)} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </Card>
  );
}

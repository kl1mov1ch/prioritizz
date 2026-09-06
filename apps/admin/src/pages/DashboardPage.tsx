import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  LoadingState,
  ErrorState,
  Segmented,
  IconChart,
  IconWallet,
  IconReceipt,
  IconCheck,
  IconGavel,
  IconCard,
  IconLayers,
  IconUsers,
} from '@prioritizz/ui';
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
        <h1 className="text-xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
        <Segmented
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({ value: r, label: r }))}
          ariaLabel="range"
        />
      </div>

      {q.isLoading && <LoadingState label={t('common.loading')} />}
      {q.isError && <ErrorState title={t('common.somethingWrong')} onRetry={() => q.refetch()} retryLabel={t('common.retry')} />}
      {q.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric icon={<IconWallet size={16} />} label={t('admin.gmv')} value={q.data.gmv} />
          <Metric icon={<IconChart size={16} />} label={t('admin.revenue')} value={q.data.revenue} />
          <Metric icon={<IconReceipt size={16} />} label={t('admin.ordersCount')} value={String(q.data.ordersCount)} />
          <Metric icon={<IconCheck size={16} />} label={t('admin.completed')} value={String(q.data.completedOrders)} />
          <Metric icon={<IconGavel size={16} />} label={t('admin.activeDisputes')} value={String(q.data.activeDisputes)} />
          <Metric icon={<IconCard size={16} />} label={t('admin.pendingPayouts')} value={String(q.data.pendingPayouts)} />
          <Metric icon={<IconLayers size={16} />} label={t('admin.pendingModeration')} value={String(q.data.pendingModeration)} />
          <Metric icon={<IconUsers size={16} />} label={t('admin.newUsers')} value={String(q.data.newUsers)} />
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="space-y-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

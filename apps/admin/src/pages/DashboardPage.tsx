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
type Range = (typeof RANGES)[number];

export default function DashboardPage() {
  const t = useT();
  const [range, setRange] = useState<Range>('7d');
  const q = useQuery({ queryKey: ['dashboard', range], queryFn: () => api.admin.dashboard(range) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="title-1">{t('admin.dashboard')}</h1>
        <Segmented
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({ value: r, label: r }))}
          ariaLabel="range"
        />
      </div>

      {q.isLoading && <LoadingState label={t('common.loading')} />}
      {q.isError && (
        <ErrorState
          title={t('common.somethingWrong')}
          onRetry={() => q.refetch()}
          retryLabel={t('common.retry')}
        />
      )}

      {q.data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={<IconWallet size={16} />} label={t('admin.gmv')} value={q.data.gmv} />
          <Metric icon={<IconChart size={16} />} label={t('admin.revenue')} value={q.data.revenue} />
          <Metric
            icon={<IconReceipt size={16} />}
            label={t('admin.ordersCount')}
            value={String(q.data.ordersCount)}
          />
          <Metric
            icon={<IconCheck size={16} />}
            label={t('admin.completed')}
            value={String(q.data.completedOrders)}
          />
          <Metric
            icon={<IconGavel size={16} />}
            label={t('admin.activeDisputes')}
            value={String(q.data.activeDisputes)}
          />
          <Metric
            icon={<IconCard size={16} />}
            label={t('admin.pendingPayouts')}
            value={String(q.data.pendingPayouts)}
          />
          <Metric
            icon={<IconLayers size={16} />}
            label={t('admin.pendingModeration')}
            value={String(q.data.pendingModeration)}
          />
          <Metric
            icon={<IconUsers size={16} />}
            label={t('admin.newUsers')}
            value={String(q.data.newUsers)}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="space-y-3">
      <span className="flex items-center gap-2 text-footnote font-medium text-muted">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/[0.12] text-primary">
          {icon}
        </span>
        {label}
      </span>
      <p className="font-display text-title1 font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

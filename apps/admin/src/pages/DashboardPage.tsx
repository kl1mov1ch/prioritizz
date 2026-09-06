import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState } from '@prioritizz/ui';
import { api } from '../lib/api';

const RANGES = ['24h', '7d', '30d', '90d'] as const;

export default function DashboardPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('7d');
  const q = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api.admin.dashboard(range),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
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

      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="GMV" value={q.data.gmv} />
          <Metric label="Revenue" value={q.data.revenue} />
          <Metric label="Orders" value={String(q.data.ordersCount)} />
          <Metric label="Completed" value={String(q.data.completedOrders)} />
          <Metric label="Active disputes" value={String(q.data.activeDisputes)} />
          <Metric label="Pending payouts" value={String(q.data.pendingPayouts)} />
          <Metric label="Pending moderation" value={String(q.data.pendingModeration)} />
          <Metric label="New users" value={String(q.data.newUsers)} />
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

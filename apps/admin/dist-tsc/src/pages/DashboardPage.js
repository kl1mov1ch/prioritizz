import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState } from '@prioritizz/ui';
import { api } from '../lib/api';
const RANGES = ['24h', '7d', '30d', '90d'];
export default function DashboardPage() {
  const [range, setRange] = useState('7d');
  const q = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api.admin.dashboard(range),
  });
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-xl font-semibold', children: 'Dashboard' }),
          _jsx('div', {
            className: 'flex gap-1',
            children: RANGES.map((r) =>
              _jsx(
                'button',
                {
                  onClick: () => setRange(r),
                  className: `rounded border px-2 py-1 text-xs ${r === range ? 'bg-primary text-primary-foreground' : ''}`,
                  children: r,
                },
                r,
              ),
            ),
          }),
        ],
      }),
      q.isLoading && _jsx(LoadingState, {}),
      q.isError && _jsx(ErrorState, { onRetry: () => q.refetch() }),
      q.data &&
        _jsxs('div', {
          className: 'grid grid-cols-2 gap-3 md:grid-cols-4',
          children: [
            _jsx(Metric, { label: 'GMV', value: q.data.gmv }),
            _jsx(Metric, { label: 'Revenue', value: q.data.revenue }),
            _jsx(Metric, { label: 'Orders', value: String(q.data.ordersCount) }),
            _jsx(Metric, { label: 'Completed', value: String(q.data.completedOrders) }),
            _jsx(Metric, { label: 'Active disputes', value: String(q.data.activeDisputes) }),
            _jsx(Metric, { label: 'Pending payouts', value: String(q.data.pendingPayouts) }),
            _jsx(Metric, { label: 'Pending moderation', value: String(q.data.pendingModeration) }),
            _jsx(Metric, { label: 'New users', value: String(q.data.newUsers) }),
          ],
        }),
    ],
  });
}
function Metric({ label, value }) {
  return _jsxs(Card, {
    className: 'p-4',
    children: [
      _jsx('p', { className: 'text-xs text-muted-foreground', children: label }),
      _jsx('p', { className: 'mt-1 text-xl font-semibold', children: value }),
    ],
  });
}
//# sourceMappingURL=DashboardPage.js.map

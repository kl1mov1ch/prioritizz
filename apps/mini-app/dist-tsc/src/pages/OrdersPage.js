import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
  if (orders.isLoading) return _jsx(LoadingState, {});
  if (!orders.data?.items.length)
    return _jsx(EmptyState, {
      title: '\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u0434\u0435\u043B\u043E\u043A',
      description:
        '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u043B\u0443\u0433\u0443 \u0432 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435.',
    });
  return _jsxs('div', {
    className: 'space-y-3',
    children: [
      _jsx('h1', {
        className: 'text-xl font-semibold',
        children: '\u041C\u043E\u0438 \u0441\u0434\u0435\u043B\u043A\u0438',
      }),
      orders.data.items.map((o) =>
        _jsx(
          Link,
          {
            to: `/orders/${o.id}`,
            children: _jsxs(Card, {
              className: 'p-4',
              children: [
                _jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    _jsx('span', { className: 'text-sm font-medium', children: o.service.title }),
                    _jsx(Badge, { variant: statusTone(o.status), children: o.status }),
                  ],
                }),
                _jsxs('div', {
                  className: 'mt-1 flex items-center justify-between text-xs text-muted-foreground',
                  children: [
                    _jsx('span', { children: o.reference }),
                    _jsx('span', { children: timeAgo(o.createdAt) }),
                  ],
                }),
                _jsx('p', {
                  className: 'mt-2 text-sm font-semibold',
                  children: formatMoney(o.totalAmount, o.currency),
                }),
              ],
            }),
          },
          o.id,
        ),
      ),
    ],
  });
}
//# sourceMappingURL=OrdersPage.js.map

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
  if (order.isLoading) return _jsx(LoadingState, {});
  if (order.isError || !order.data) return _jsx(ErrorState, { onRetry: () => order.refetch() });
  const o = order.data;
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-lg font-semibold', children: o.reference }),
          _jsx(Badge, { variant: statusTone(o.status), children: o.status }),
        ],
      }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsx('p', { className: 'font-medium', children: o.service.title }),
          _jsxs('dl', {
            className: 'mt-2 space-y-1 text-sm',
            children: [
              _jsx(Row, {
                k: '\u0421\u0443\u043C\u043C\u0430',
                v: formatMoney(o.totalAmount, o.currency),
              }),
              _jsx(Row, { k: '\u041E\u043F\u043B\u0430\u0442\u0430', v: o.paymentStatus }),
              _jsx(Row, {
                k: '\u0413\u0430\u0440\u0430\u043D\u0442\u0438\u044F (escrow)',
                v: o.escrowStatus,
              }),
              o.autoReleaseAt &&
                _jsx(Row, {
                  k: '\u0410\u0432\u0442\u043E-\u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435',
                  v: formatDateTime(o.autoReleaseAt),
                }),
            ],
          }),
        ],
      }),
      o.deliveryPayload &&
        _jsxs(Card, {
          className: 'p-4',
          children: [
            _jsx('p', {
              className: 'text-sm font-medium',
              children: '\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442',
            }),
            _jsx('pre', {
              className: 'mt-1 whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs',
              children: o.deliveryPayload,
            }),
          ],
        }),
      o.status === 'DELIVERED' &&
        _jsx(Button, {
          size: 'block',
          loading: confirm.isPending,
          onClick: () => confirm.mutate(),
          children:
            '\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435',
        }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsx('p', {
            className: 'mb-2 text-sm font-medium',
            children: '\u0418\u0441\u0442\u043E\u0440\u0438\u044F',
          }),
          _jsx('ol', {
            className: 'space-y-2',
            children: (timeline.data ?? []).map((e) =>
              _jsxs(
                'li',
                {
                  className: 'text-xs text-muted-foreground',
                  children: [
                    _jsx('span', { className: 'font-mono', children: formatDateTime(e.createdAt) }),
                    ' \u2014 ',
                    e.type,
                    e.toStatus ? ` → ${e.toStatus}` : '',
                  ],
                },
                e.id,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function Row({ k, v }) {
  return _jsxs('div', {
    className: 'flex justify-between',
    children: [
      _jsx('dt', { className: 'text-muted-foreground', children: k }),
      _jsx('dd', { children: v }),
    ],
  });
}
//# sourceMappingURL=OrderPage.js.map

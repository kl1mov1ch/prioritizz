import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, LoadingState, formatMoney } from '@prioritizz/ui';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';
export default function ServicePage() {
  const { idOrSlug = '' } = useParams();
  const navigate = useNavigate();
  const service = useQuery({
    queryKey: ['service', idOrSlug],
    queryFn: () => api.catalog.getService(idOrSlug),
  });
  const createOrder = useMutation({
    mutationFn: () =>
      api.orders.create({ serviceId: service.data.id, quantity: 1 }, crypto.randomUUID()),
    onSuccess: (order) => {
      haptic('medium');
      navigate(`/orders/${order.id}`);
    },
  });
  if (service.isLoading) return _jsx(LoadingState, {});
  if (service.isError || !service.data)
    return _jsx(ErrorState, { onRetry: () => service.refetch() });
  const s = service.data;
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('button', {
        onClick: () => navigate(-1),
        className: 'text-sm text-muted-foreground',
        children: '\u2190 \u041D\u0430\u0437\u0430\u0434',
      }),
      _jsxs('div', {
        className: 'space-y-2',
        children: [
          _jsx('h1', { className: 'text-lg font-semibold', children: s.title }),
          _jsxs('div', {
            className: 'flex flex-wrap gap-1.5',
            children: [
              _jsx(Badge, { variant: 'secondary', children: s.category.name }),
              _jsx(Badge, { variant: 'outline', children: s.kind }),
              _jsxs(Badge, { variant: 'outline', children: ['SLA ', s.slaHours, ' \u0447'] }),
            ],
          }),
        ],
      }),
      _jsx(Card, {
        className: 'p-4',
        children: _jsx('p', { className: 'whitespace-pre-wrap text-sm', children: s.description }),
      }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsx('p', {
            className: 'text-sm font-medium',
            children: '\u041F\u0440\u043E\u0434\u0430\u0432\u0435\u0446',
          }),
          _jsxs('p', {
            className: 'text-sm text-muted-foreground',
            children: [
              s.seller.displayName,
              ' \u00B7 \u2605 ',
              s.seller.ratingAvg.toFixed(1),
              ' \u00B7 ',
              s.seller.tier,
            ],
          }),
        ],
      }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsx('p', {
            className: 'text-sm font-medium',
            children:
              '\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430',
          }),
          _jsx('p', { className: 'text-sm text-muted-foreground', children: s.refundPolicy }),
        ],
      }),
      _jsxs('div', {
        className: 'sticky bottom-24 rounded-lg border bg-background p-4 shadow-lg',
        children: [
          _jsxs('div', {
            className: 'mb-3 flex items-center justify-between',
            children: [
              _jsx('span', {
                className: 'text-sm text-muted-foreground',
                children: '\u041A \u043E\u043F\u043B\u0430\u0442\u0435',
              }),
              _jsx('span', {
                className: 'text-lg font-semibold',
                children: formatMoney(s.basePriceAmount, s.currency),
              }),
            ],
          }),
          _jsx(Button, {
            size: 'block',
            loading: createOrder.isPending,
            onClick: () => createOrder.mutate(),
            children:
              '\u041A\u0443\u043F\u0438\u0442\u044C \u0441 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0435\u0439',
          }),
          createOrder.isError &&
            _jsx('p', {
              className: 'mt-2 text-xs text-destructive',
              children: createOrder.error.message,
            }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=ServicePage.js.map

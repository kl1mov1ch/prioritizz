import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, ErrorState, LoadingState, formatMoney } from '@prioritizz/ui';
import { api } from '../lib/api';
export default function CatalogPage() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const services = useQuery({
    queryKey: ['services', { q, categoryId }],
    queryFn: () => api.catalog.listServices({ q: q || undefined, categoryId, pageSize: 20 }),
  });
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('header', {
        className: 'space-y-1',
        children: [
          _jsx('h1', { className: 'text-xl font-semibold', children: 'Prioritizz' }),
          _jsx('p', {
            className: 'text-sm text-muted-foreground',
            children:
              '\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0435 \u0441\u0434\u0435\u043B\u043A\u0438 \u0432\u043D\u0443\u0442\u0440\u0438 Telegram',
          }),
        ],
      }),
      _jsx('input', {
        value: q,
        onChange: (e) => setQ(e.target.value),
        placeholder: '\u041F\u043E\u0438\u0441\u043A \u0443\u0441\u043B\u0443\u0433\u2026',
        className:
          'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
      }),
      _jsxs('div', {
        className: 'flex gap-2 overflow-x-auto pb-1',
        children: [
          _jsx('button', {
            onClick: () => setCategoryId(undefined),
            className: `shrink-0 rounded-full border px-3 py-1 text-xs ${!categoryId ? 'bg-primary text-primary-foreground' : ''}`,
            children: '\u0412\u0441\u0435',
          }),
          (categories.data ?? []).map((c) =>
            _jsxs(
              'button',
              {
                onClick: () => setCategoryId(c.id),
                className: `shrink-0 rounded-full border px-3 py-1 text-xs ${categoryId === c.id ? 'bg-primary text-primary-foreground' : ''}`,
                children: [c.icon, ' ', c.name],
              },
              c.id,
            ),
          ),
        ],
      }),
      services.isLoading && _jsx(LoadingState, {}),
      services.isError && _jsx(ErrorState, { onRetry: () => services.refetch() }),
      services.data?.items.length === 0 &&
        _jsx(EmptyState, {
          title:
            '\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E',
          description:
            '\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B.',
        }),
      _jsx('ul', {
        className: 'space-y-3',
        children: services.data?.items.map((s) =>
          _jsx(
            'li',
            {
              children: _jsx(Link, {
                to: `/catalog/${s.slug}`,
                children: _jsx(Card, {
                  className: 'p-4',
                  children: _jsxs('div', {
                    className: 'flex items-start justify-between gap-3',
                    children: [
                      _jsxs('div', {
                        className: 'min-w-0',
                        children: [
                          _jsx('p', { className: 'truncate font-medium', children: s.title }),
                          _jsx('p', {
                            className: 'line-clamp-2 text-sm text-muted-foreground',
                            children: s.summary,
                          }),
                          _jsxs('div', {
                            className: 'mt-2 flex flex-wrap gap-1.5',
                            children: [
                              _jsx(Badge, { variant: 'secondary', children: s.category.name }),
                              s.seller.isVerified &&
                                _jsx(Badge, {
                                  variant: 'success',
                                  children:
                                    '\u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0439',
                                }),
                              _jsxs(Badge, {
                                variant: 'outline',
                                children: ['\u2605 ', s.ratingAvg.toFixed(1)],
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'shrink-0 text-right',
                        children: [
                          _jsx('p', {
                            className: 'font-semibold',
                            children: formatMoney(s.basePriceAmount, s.currency),
                          }),
                          _jsxs('p', {
                            className: 'text-xs text-muted-foreground',
                            children: [s.slaHours, ' \u0447'],
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              }),
            },
            s.id,
          ),
        ),
      }),
    ],
  });
}
//# sourceMappingURL=CatalogPage.js.map

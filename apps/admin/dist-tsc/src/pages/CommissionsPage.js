import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState } from '@prioritizz/ui';
import { api } from '../lib/api';
export default function CommissionsPage() {
  const q = useQuery({
    queryKey: ['admin', 'commission-rules'],
    queryFn: () => api.admin.commissionRules(),
  });
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', { className: 'text-xl font-semibold', children: 'Commission rules' }),
      q.isLoading
        ? _jsx(LoadingState, {})
        : _jsx('div', {
            className: 'space-y-2',
            children: (q.data ?? []).map((r) =>
              _jsxs(
                Card,
                {
                  className: 'flex items-center justify-between p-4',
                  children: [
                    _jsxs('div', {
                      children: [
                        _jsx('p', { className: 'font-medium', children: r.name }),
                        _jsxs('p', {
                          className: 'text-xs text-muted-foreground',
                          children: [
                            r.scope,
                            ' \u00B7 priority ',
                            r.priority,
                            ' \u00B7 ',
                            JSON.stringify(r.matcher),
                          ],
                        }),
                      ],
                    }),
                    _jsxs('span', {
                      className: 'font-semibold',
                      children: [(r.percentBps / 100).toFixed(2), '%'],
                    }),
                  ],
                },
                r.id,
              ),
            ),
          }),
    ],
  });
}
//# sourceMappingURL=CommissionsPage.js.map

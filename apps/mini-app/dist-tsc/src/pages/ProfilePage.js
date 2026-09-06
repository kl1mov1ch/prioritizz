import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, formatMoney } from '@prioritizz/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', {
        className: 'text-xl font-semibold',
        children: '\u041F\u0440\u043E\u0444\u0438\u043B\u044C',
      }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsxs('p', {
            className: 'font-medium',
            children: [user?.firstName, ' ', user?.lastName],
          }),
          _jsxs('p', {
            className: 'text-sm text-muted-foreground',
            children: ['@', user?.username ?? '—'],
          }),
          _jsxs('p', {
            className: 'mt-1 text-xs text-muted-foreground',
            children: ['\u0420\u043E\u043B\u0438: ', user?.roles.join(', ')],
          }),
        ],
      }),
      _jsxs(Card, {
        className: 'p-4',
        children: [
          _jsx('p', {
            className: 'mb-2 text-sm font-medium',
            children: '\u041A\u043E\u0448\u0435\u043B\u0451\u043A',
          }),
          wallet.isLoading
            ? _jsx(LoadingState, {})
            : wallet.data
              ? _jsxs('dl', {
                  className: 'space-y-1 text-sm',
                  children: [
                    _jsx(Row, {
                      k: '\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E',
                      v: formatMoney(wallet.data.available, wallet.data.currency),
                    }),
                    _jsx(Row, {
                      k: '\u0412 \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u0438',
                      v: formatMoney(wallet.data.pending, wallet.data.currency),
                    }),
                    _jsx(Row, {
                      k: '\u0412 \u0441\u0434\u0435\u043B\u043A\u0430\u0445',
                      v: formatMoney(wallet.data.inEscrow, wallet.data.currency),
                    }),
                  ],
                })
              : null,
        ],
      }),
      !user?.isSeller &&
        _jsxs(Card, {
          className: 'p-4',
          children: [
            _jsx('p', {
              className: 'text-sm font-medium',
              children:
                '\u0421\u0442\u0430\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0432\u0446\u043E\u043C',
            }),
            _jsx('p', {
              className: 'text-sm text-muted-foreground',
              children:
                '\u0421\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043E\u0444\u0444\u0435\u0440\u044B \u0438 \u043F\u0440\u043E\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 \u0441 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0435\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B.',
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
//# sourceMappingURL=ProfilePage.js.map

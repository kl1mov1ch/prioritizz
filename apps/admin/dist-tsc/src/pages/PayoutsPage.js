import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Card } from '@prioritizz/ui';
/** Placeholder — wired to /admin/payouts + approve/reject in M6. */
export default function PayoutsPage() {
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', { className: 'text-xl font-semibold', children: 'Payouts' }),
      _jsxs(Card, {
        className: 'p-6 text-sm text-muted-foreground',
        children: [
          'Payout approval queue lands in M6. Backend:',
          ' ',
          _jsx('code', { children: 'POST /api/v1/admin/payouts/:id/decision' }),
          '.',
        ],
      }),
    ],
  });
}
//# sourceMappingURL=PayoutsPage.js.map

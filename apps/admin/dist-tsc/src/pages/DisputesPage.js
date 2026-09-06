import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Card } from '@prioritizz/ui';
/** Placeholder — wired to /admin/disputes + resolve action in M5/M8. */
export default function DisputesPage() {
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', { className: 'text-xl font-semibold', children: 'Disputes' }),
      _jsxs(Card, {
        className: 'p-6 text-sm text-muted-foreground',
        children: [
          'Dispute review & resolution (release / refund / split) lands in M5. Backend: ',
          _jsx('code', { children: 'POST /api/v1/admin/disputes/:id/resolve' }),
          '.',
        ],
      }),
    ],
  });
}
//# sourceMappingURL=DisputesPage.js.map

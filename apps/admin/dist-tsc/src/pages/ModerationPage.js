import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Card } from '@prioritizz/ui';
/** Placeholder — wired to /admin/services?moderationStatus=PENDING in M8. */
export default function ModerationPage() {
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', { className: 'text-xl font-semibold', children: 'Moderation queue' }),
      _jsxs(Card, {
        className: 'p-6 text-sm text-muted-foreground',
        children: [
          'Listing moderation UI (approve / reject / escalate) lands in milestone M8. Backend endpoint: ',
          _jsx('code', { children: 'POST /api/v1/admin/services/:id/moderate' }),
          '.',
        ],
      }),
    ],
  });
}
//# sourceMappingURL=ModerationPage.js.map

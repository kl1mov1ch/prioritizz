import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@prioritizz/ui';
import { useAuthStore } from '../lib/auth-store';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@prioritizz/constants';
const NAV = [
  { to: '/dashboard', label: 'Dashboard', perm: PERMISSIONS.AUDIT_READ },
  { to: '/users', label: 'Users', perm: PERMISSIONS.USERS_MANAGE },
  { to: '/moderation', label: 'Moderation', perm: PERMISSIONS.CATALOG_MODERATE },
  { to: '/disputes', label: 'Disputes', perm: PERMISSIONS.DISPUTES_RESOLVE },
  { to: '/payouts', label: 'Payouts', perm: PERMISSIONS.PAYOUTS_APPROVE },
  { to: '/commissions', label: 'Commissions', perm: PERMISSIONS.COMMISSIONS_MANAGE },
];
export function AdminLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const perms = new Set((user?.roles ?? []).flatMap((r) => ROLE_PERMISSIONS[r] ?? []));
  return _jsxs('div', {
    className: 'flex h-full',
    children: [
      _jsxs('aside', {
        className: 'flex w-56 shrink-0 flex-col border-r bg-card',
        children: [
          _jsx('div', { className: 'p-4 text-lg font-semibold', children: 'Prioritizz' }),
          _jsx('nav', {
            className: 'flex-1 space-y-1 px-2',
            children: NAV.filter((n) => perms.has(n.perm)).map((n) =>
              _jsx(
                NavLink,
                {
                  to: n.to,
                  className: ({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-2 text-sm',
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                    ),
                  children: n.label,
                },
                n.to,
              ),
            ),
          }),
          _jsxs('div', {
            className: 'border-t p-3 text-xs text-muted-foreground',
            children: [
              _jsx('p', { className: 'truncate', children: user?.username ?? user?.firstName }),
              _jsx('button', {
                className: 'mt-1 text-destructive',
                onClick: () => {
                  clear();
                  navigate('/login');
                },
                children: 'Sign out',
              }),
            ],
          }),
        ],
      }),
      _jsx('main', { className: 'flex-1 overflow-auto p-6', children: _jsx(Outlet, {}) }),
    ],
  });
}
//# sourceMappingURL=AdminLayout.js.map

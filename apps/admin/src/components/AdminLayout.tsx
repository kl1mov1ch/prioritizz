import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@prioritizz/ui';
import { useAuthStore } from '../lib/auth-store';
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from '@prioritizz/constants';

const NAV: { to: string; label: string; perm: Permission }[] = [
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

  const perms = new Set<Permission>(
    (user?.roles ?? []).flatMap((r) => ROLE_PERMISSIONS[r as Role] ?? []),
  );

  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="p-4 text-lg font-semibold">Prioritizz</div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV.filter((n) => perms.has(n.perm)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          <p className="truncate">{user?.username ?? user?.firstName}</p>
          <button
            className="mt-1 text-destructive"
            onClick={() => {
              clear();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

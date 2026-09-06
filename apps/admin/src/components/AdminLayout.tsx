import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn, ThemeToggle } from '@prioritizz/ui';
import { useT, LanguageToggle, type MessageKey } from '@prioritizz/i18n';
import { useAuthStore } from '../lib/auth-store';
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from '@prioritizz/constants';

const NAV: { to: string; labelKey: MessageKey; perm: Permission }[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', perm: PERMISSIONS.AUDIT_READ },
  { to: '/users', labelKey: 'nav.users', perm: PERMISSIONS.USERS_MANAGE },
  { to: '/moderation', labelKey: 'nav.moderation', perm: PERMISSIONS.CATALOG_MODERATE },
  { to: '/disputes', labelKey: 'nav.disputes', perm: PERMISSIONS.DISPUTES_RESOLVE },
  { to: '/payouts', labelKey: 'nav.payouts', perm: PERMISSIONS.PAYOUTS_APPROVE },
  { to: '/commissions', labelKey: 'nav.commissions', perm: PERMISSIONS.COMMISSIONS_MANAGE },
];

export function AdminLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();

  const perms = new Set<Permission>(
    (user?.roles ?? []).flatMap((r) => ROLE_PERMISSIONS[r as Role] ?? []),
  );

  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="p-4 text-lg font-semibold">{t('common.appName')}</div>
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
              {t(n.labelKey)}
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
            {t('common.signOut')}
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-2 border-b bg-background px-6 py-2">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

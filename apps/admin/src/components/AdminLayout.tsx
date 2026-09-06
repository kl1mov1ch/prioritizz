import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  cn,
  ThemeToggle,
  IconChart,
  IconUsers,
  IconLayers,
  IconGavel,
  IconCard,
  IconPercent,
  IconShield,
  IconLogout,
} from '@prioritizz/ui';
import { useT, LanguageToggle, type MessageKey } from '@prioritizz/i18n';
import { useAuthStore } from '../lib/auth-store';
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from '@prioritizz/constants';

const NAV: { to: string; labelKey: MessageKey; perm: Permission; Icon: typeof IconChart }[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', perm: PERMISSIONS.AUDIT_READ, Icon: IconChart },
  { to: '/users', labelKey: 'nav.users', perm: PERMISSIONS.USERS_MANAGE, Icon: IconUsers },
  {
    to: '/moderation',
    labelKey: 'nav.moderation',
    perm: PERMISSIONS.CATALOG_MODERATE,
    Icon: IconLayers,
  },
  { to: '/disputes', labelKey: 'nav.disputes', perm: PERMISSIONS.DISPUTES_RESOLVE, Icon: IconGavel },
  { to: '/payouts', labelKey: 'nav.payouts', perm: PERMISSIONS.PAYOUTS_APPROVE, Icon: IconCard },
  {
    to: '/commissions',
    labelKey: 'nav.commissions',
    perm: PERMISSIONS.COMMISSIONS_MANAGE,
    Icon: IconPercent,
  },
];

/** macOS split-view proportions: fixed 240pt sidebar + flexible detail. */
export function AdminLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const perms = new Set<Permission>(
    (user?.roles ?? []).flatMap((r) => ROLE_PERMISSIONS[r as Role] ?? []),
  );

  return (
    <div className="flex h-full gap-4 p-4">
      <aside className="material-thin flex w-60 shrink-0 flex-col rounded-3xl p-3">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconShield size={17} />
          </span>
          <span className="font-display text-title3 font-semibold">{t('common.appName')}</span>
        </div>

        <nav className="mt-3 flex-1 space-y-0.5">
          {NAV.filter((n) => perms.has(n.perm)).map(({ to, labelKey, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-dense items-center gap-2.5 rounded-lg px-3 py-2 text-subhead font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary/[0.12] text-primary'
                    : 'text-muted hover:bg-grouped hover:text-foreground',
                )
              }
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 border-t border-separator pt-3">
          <p className="truncate px-3 text-footnote text-muted">
            {user?.username ?? user?.firstName}
          </p>
          <button
            type="button"
            className="mt-1 flex w-full min-h-dense items-center gap-2 rounded-lg px-3 py-2 text-footnote font-medium text-tint-red transition-colors hover:bg-tint-red/[0.1]"
            onClick={() => {
              clear();
              navigate('/login');
            }}
          >
            <IconLogout size={15} /> {t('common.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="material-thin mb-4 flex items-center justify-end gap-2 rounded-2xl px-4 py-2">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </header>
        <main key={location.pathname} className="flex-1 animate-fade-up overflow-auto pb-4 pr-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

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
  { to: '/moderation', labelKey: 'nav.moderation', perm: PERMISSIONS.CATALOG_MODERATE, Icon: IconLayers },
  { to: '/disputes', labelKey: 'nav.disputes', perm: PERMISSIONS.DISPUTES_RESOLVE, Icon: IconGavel },
  { to: '/payouts', labelKey: 'nav.payouts', perm: PERMISSIONS.PAYOUTS_APPROVE, Icon: IconCard },
  { to: '/commissions', labelKey: 'nav.commissions', perm: PERMISSIONS.COMMISSIONS_MANAGE, Icon: IconPercent },
];

export function AdminLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const perms = new Set<Permission>(
    (user?.roles ?? []).flatMap((r) => ROLE_PERMISSIONS[r as Role] ?? []),
  );

  return (
    <div className="flex h-full gap-3 p-3">
      <aside className="glass-strong flex w-60 shrink-0 flex-col rounded-2xl p-3">
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
            <IconShield size={17} />
          </span>
          <span className="text-base font-bold text-gradient">{t('common.appName')}</span>
        </div>
        <nav className="mt-2 flex-1 space-y-1">
          {NAV.filter((n) => perms.has(n.perm)).map(({ to, labelKey, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-gradient text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:bg-[hsl(var(--glass-bg))] hover:text-foreground',
                )
              }
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-2 border-t hairline pt-3">
          <p className="truncate px-2 text-xs text-muted-foreground">
            {user?.username ?? user?.firstName}
          </p>
          <button
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              clear();
              navigate('/login');
            }}
          >
            <IconLogout size={15} /> {t('common.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass-strong mb-3 flex items-center justify-end gap-2 rounded-2xl px-4 py-2.5">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </header>
        <main key={location.pathname} className="flex-1 overflow-auto pr-1 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

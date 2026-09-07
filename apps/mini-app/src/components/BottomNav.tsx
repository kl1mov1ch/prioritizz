import { NavLink } from 'react-router-dom';
import { cn, IconBag, IconReceipt, IconUser, IconStorefront } from '@prioritizz/ui';
import { useT, type MessageKey } from '@prioritizz/i18n';
import { useAuthStore } from '../lib/auth-store';

type Item = { to: string; key: MessageKey; Icon: typeof IconBag };

const CATALOG: Item = { to: '/catalog', key: 'nav.catalog', Icon: IconBag };
const ORDERS: Item = { to: '/orders', key: 'nav.orders', Icon: IconReceipt };
const SELL: Item = { to: '/sell', key: 'nav.sell', Icon: IconStorefront };
const PROFILE: Item = { to: '/profile', key: 'nav.profile', Icon: IconUser };

/**
 * Floating tab pill — the one element allowed a soft shadow (Arc nav rule).
 * Columns are derived from `items` so the seller tab appearing never needs a
 * class change, and every label truncates so a long RU word can't push a tab
 * past the pill edge on a 320px screen.
 */
export function BottomNav() {
  const t = useT();
  const isSeller = useAuthStore((s) => !!s.user?.isSeller);

  const items: Item[] = isSeller ? [CATALOG, ORDERS, SELL, PROFILE] : [CATALOG, ORDERS, PROFILE];

  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-4 pt-2">
      <ul
        className="material-thick grid gap-1 rounded-3xl p-1.5 shadow-float"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, key, Icon }) => (
          <li key={to} className="min-w-0">
            <NavLink
              to={to}
              end={to === '/sell'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[52px] w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-[color,background,transform] duration-150 active:scale-95',
                  isActive ? 'bg-primary/[0.12] text-primary' : 'text-subtle hover:text-foreground',
                )
              }
            >
              <Icon size={24} className="shrink-0" />
              <span className="w-full truncate text-center text-caption2 font-semibold tracking-[-0.004em]">
                {t(key)}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

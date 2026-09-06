import { NavLink } from 'react-router-dom';
import { cn, IconBag, IconReceipt, IconUser } from '@prioritizz/ui';
import { useT, type MessageKey } from '@prioritizz/i18n';

const items: { to: string; key: MessageKey; Icon: typeof IconBag }[] = [
  { to: '/catalog', key: 'nav.catalog', Icon: IconBag },
  { to: '/orders', key: 'nav.orders', Icon: IconReceipt },
  { to: '/profile', key: 'nav.profile', Icon: IconUser },
];

/** Floating tab pill — the one element allowed a soft shadow (Arc nav rule). */
export function BottomNav() {
  const t = useT();
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-4 pt-2">
      <ul className="material-thick grid grid-cols-3 gap-1 rounded-3xl p-1.5 shadow-float">
        {items.map(({ to, key, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch flex-col items-center justify-center gap-1 rounded-2xl py-2 text-caption font-semibold tracking-[-0.004em] transition-[color,background,transform] duration-150 active:scale-95',
                  isActive ? 'bg-primary/[0.12] text-primary' : 'text-subtle hover:text-foreground',
                )
              }
            >
              <Icon size={22} />
              {t(key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

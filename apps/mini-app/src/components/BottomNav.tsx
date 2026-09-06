import { NavLink } from 'react-router-dom';
import { cn, IconBag, IconReceipt, IconUser } from '@prioritizz/ui';
import { useT, type MessageKey } from '@prioritizz/i18n';

const items: { to: string; key: MessageKey; Icon: typeof IconBag }[] = [
  { to: '/catalog', key: 'nav.catalog', Icon: IconBag },
  { to: '/orders', key: 'nav.orders', Icon: IconReceipt },
  { to: '/profile', key: 'nav.profile', Icon: IconUser },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <ul className="glass-strong grid grid-cols-3 gap-1 rounded-2xl p-1.5">
        {items.map(({ to, key, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl py-2 text-[0.68rem] font-semibold transition-all duration-150 active:scale-95',
                  isActive
                    ? 'bg-brand-gradient text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon size={20} />
              {t(key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

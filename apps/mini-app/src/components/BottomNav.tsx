import { NavLink } from 'react-router-dom';
import { cn } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

const items = [
  { to: '/catalog', key: 'nav.catalog', icon: '🛍️' },
  { to: '/orders', key: 'nav.orders', icon: '📑' },
  { to: '/profile', key: 'nav.profile', icon: '👤' },
] as const;

export function BottomNav() {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-3">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <span className="text-lg">{it.icon}</span>
              {t(it.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { cn } from '@prioritizz/ui';

const items = [
  { to: '/catalog', label: 'Каталог', icon: '🛍️' },
  { to: '/orders', label: 'Сделки', icon: '📑' },
  { to: '/profile', label: 'Профиль', icon: '👤' },
];

export function BottomNav() {
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
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

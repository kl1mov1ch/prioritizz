import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { cn } from '@prioritizz/ui';
const items = [
    { to: '/catalog', label: 'Каталог', icon: '🛍️' },
    { to: '/orders', label: 'Сделки', icon: '📑' },
    { to: '/profile', label: 'Профиль', icon: '👤' },
];
export function BottomNav() {
    return (_jsx("nav", { className: "fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t bg-background/95 backdrop-blur", children: _jsx("ul", { className: "grid grid-cols-3", children: items.map((it) => (_jsx("li", { children: _jsxs(NavLink, { to: it.to, className: ({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-xs', isActive ? 'text-primary' : 'text-muted-foreground'), children: [_jsx("span", { className: "text-lg", children: it.icon }), it.label] }) }, it.to))) }) }));
}
//# sourceMappingURL=BottomNav.js.map
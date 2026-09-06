import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { BottomNav } from './BottomNav';
import { LoadingState, ErrorState } from '@prioritizz/ui';
export function AppShell() {
    const { status, retry } = useTelegramAuth();
    const location = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);
    if (status === 'loading')
        return _jsx(LoadingState, { label: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0447\u0435\u0440\u0435\u0437 Telegram\u2026" });
    if (status === 'error')
        return (_jsx("div", { className: "p-4", children: _jsx(ErrorState, { title: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438", description: "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438\u0437 Telegram \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430.", onRetry: retry }) }));
    return (_jsxs("div", { className: "mx-auto flex min-h-full max-w-lg flex-col", children: [_jsx("main", { className: "flex-1 px-4 pb-24 pt-4", children: _jsx(Outlet, {}) }), _jsx(BottomNav, {})] }));
}
//# sourceMappingURL=AppShell.js.map
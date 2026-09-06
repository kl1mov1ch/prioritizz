import { jsx as _jsx } from 'react/jsx-runtime';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@prioritizz/ui';
import { AdminLayout } from './components/AdminLayout';
import { useAuthStore } from './lib/auth-store';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ModerationPage = lazy(() => import('./pages/ModerationPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));
const PayoutsPage = lazy(() => import('./pages/PayoutsPage'));
const CommissionsPage = lazy(() => import('./pages/CommissionsPage'));
const wrap = (el) => _jsx(Suspense, { fallback: _jsx(LoadingState, {}), children: el });
function RequireAdmin() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  return isAdmin ? _jsx(Outlet, {}) : _jsx(Navigate, { to: '/login', replace: true });
}
export const router = createBrowserRouter([
  { path: '/login', element: wrap(_jsx(LoginPage, {})) },
  {
    path: '/',
    element: _jsx(RequireAdmin, {}),
    children: [
      {
        element: _jsx(AdminLayout, {}),
        children: [
          { index: true, element: _jsx(Navigate, { to: '/dashboard', replace: true }) },
          { path: 'dashboard', element: wrap(_jsx(DashboardPage, {})) },
          { path: 'users', element: wrap(_jsx(UsersPage, {})) },
          { path: 'moderation', element: wrap(_jsx(ModerationPage, {})) },
          { path: 'disputes', element: wrap(_jsx(DisputesPage, {})) },
          { path: 'payouts', element: wrap(_jsx(PayoutsPage, {})) },
          { path: 'commissions', element: wrap(_jsx(CommissionsPage, {})) },
        ],
      },
    ],
  },
]);
//# sourceMappingURL=router.js.map

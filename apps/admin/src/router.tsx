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

const wrap = (el: React.ReactNode) => <Suspense fallback={<LoadingState />}>{el}</Suspense>;

function RequireAdmin() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: '/login', element: wrap(<LoginPage />) },
  {
    path: '/',
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: wrap(<DashboardPage />) },
          { path: 'users', element: wrap(<UsersPage />) },
          { path: 'moderation', element: wrap(<ModerationPage />) },
          { path: 'disputes', element: wrap(<DisputesPage />) },
          { path: 'payouts', element: wrap(<PayoutsPage />) },
          { path: 'commissions', element: wrap(<CommissionsPage />) },
        ],
      },
    ],
  },
]);

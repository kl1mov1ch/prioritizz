import { jsx as _jsx } from 'react/jsx-runtime';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@prioritizz/ui';
import { AppShell } from './components/AppShell';
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const wrap = (el) => _jsx(Suspense, { fallback: _jsx(LoadingState, {}), children: el });
export const router = createBrowserRouter([
  {
    path: '/',
    element: _jsx(AppShell, {}),
    children: [
      { index: true, element: _jsx(Navigate, { to: '/catalog', replace: true }) },
      { path: 'catalog', element: wrap(_jsx(CatalogPage, {})) },
      { path: 'catalog/:idOrSlug', element: wrap(_jsx(ServicePage, {})) },
      { path: 'orders', element: wrap(_jsx(OrdersPage, {})) },
      { path: 'orders/:id', element: wrap(_jsx(OrderPage, {})) },
      { path: 'profile', element: wrap(_jsx(ProfilePage, {})) },
    ],
  },
]);
//# sourceMappingURL=router.js.map

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@prioritizz/ui';
import { AppShell } from './components/AppShell';

const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const wrap = (el: React.ReactNode) => <Suspense fallback={<LoadingState />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      { path: 'catalog', element: wrap(<CatalogPage />) },
      { path: 'catalog/:idOrSlug', element: wrap(<ServicePage />) },
      { path: 'orders', element: wrap(<OrdersPage />) },
      { path: 'orders/:id', element: wrap(<OrderPage />) },
      { path: 'profile', element: wrap(<ProfilePage />) },
    ],
  },
]);

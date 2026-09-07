import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@prioritizz/ui';
import { AppShell } from './components/AppShell';
import { useAuthStore } from './lib/auth-store';

const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BecomeSellerPage = lazy(() => import('./pages/BecomeSellerPage'));
const SellerListingsPage = lazy(() => import('./pages/SellerListingsPage'));
const ListingFormPage = lazy(() => import('./pages/ListingFormPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const wrap = (el: React.ReactNode) => <Suspense fallback={<LoadingState />}>{el}</Suspense>;

/** Seller-only subtree. A non-seller is bounced to the onboarding form rather
 *  than a dead end. `isSeller` comes from the JWT-derived auth user, which the
 *  become-seller flow refreshes on success. */
function RequireSeller() {
  const isSeller = useAuthStore((s) => !!s.user?.isSeller);
  return isSeller ? <Outlet /> : <Navigate to="/sell/start" replace />;
}

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
      { path: 'orders/:id/chat', element: wrap(<ChatPage />) },
      { path: 'profile', element: wrap(<ProfilePage />) },
      { path: 'settings', element: wrap(<SettingsPage />) },

      { path: 'sell/start', element: wrap(<BecomeSellerPage />) },
      {
        path: 'sell',
        element: <RequireSeller />,
        children: [
          { index: true, element: wrap(<SellerListingsPage />) },
          { path: 'new', element: wrap(<ListingFormPage />) },
          { path: ':id/edit', element: wrap(<ListingFormPage />) },
        ],
      },
    ],
  },
]);

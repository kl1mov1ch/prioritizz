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

  if (status === 'loading') return <LoadingState label="Авторизация через Telegram…" />;
  if (status === 'error')
    return (
      <div className="p-4">
        <ErrorState
          title="Не удалось войти"
          description="Откройте приложение из Telegram и попробуйте снова."
          onRetry={retry}
        />
      </div>
    );

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

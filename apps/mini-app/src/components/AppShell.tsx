import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LoadingState, ErrorState, ThemeToggle } from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { BottomNav } from './BottomNav';

export function AppShell() {
  const { status, retry } = useTelegramAuth();
  const location = useLocation();
  const t = useT();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (status === 'loading') return <LoadingState label={t('auth.authorizing')} />;
  if (status === 'error')
    return (
      <div className="p-4">
        <ErrorState title={t('auth.failedTitle')} description={t('auth.failedDesc')} onRetry={retry} />
      </div>
    );

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur">
        <span className="text-sm font-semibold">{t('common.appName')}</span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle
            labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }}
          />
        </div>
      </header>
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

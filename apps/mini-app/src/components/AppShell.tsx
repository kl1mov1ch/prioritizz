import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LoadingState, ErrorState, ThemeToggle, IconShield } from '@prioritizz/ui';
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

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      {/* Nav bar: thin material over content, no shadow */}
      <header className="material-thin sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 safe-t">
        <span className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconShield size={16} />
          </span>
          <span className="font-display text-body font-semibold">{t('common.appName')}</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </div>
      </header>

      <main key={location.pathname} className="flex-1 animate-fade-up px-4 pb-28 pt-5">
        {status === 'loading' && <LoadingState label={t('auth.authorizing')} />}
        {status === 'error' && (
          <ErrorState
            title={t('auth.failedTitle')}
            description={t('auth.failedDesc')}
            onRetry={retry}
            retryLabel={t('common.retry')}
          />
        )}
        {status === 'ready' && <Outlet />}
      </main>

      {status === 'ready' && <BottomNav />}
    </div>
  );
}

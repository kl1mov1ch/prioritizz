import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LoadingState, ErrorState, IconShield } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
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
      {/* Brand only. Theme + language live in Profile → Settings, not on every
          screen — the user sees the product, not its controls. */}
      <header className="material-thin safe-t sticky top-0 z-20 flex items-center gap-2.5 px-4 py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <IconShield size={16} />
        </span>
        <span className="truncate font-display text-body font-semibold">{t('common.appName')}</span>
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

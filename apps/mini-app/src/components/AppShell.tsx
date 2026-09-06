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
      <header className="glass-strong sticky top-0 z-20 mx-3 mt-3 flex items-center justify-between rounded-2xl px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
            <IconShield size={16} />
          </span>
          <span className="text-gradient">{t('common.appName')}</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </div>
      </header>

      <main key={location.pathname} className="flex-1 px-4 pb-28 pt-5 animate-fade-up">
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

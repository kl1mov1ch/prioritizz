import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@prioritizz/ui';
import { I18nProvider } from '@prioritizz/i18n';
import { initTelegram, getTelegramColorScheme, getTelegramLocale } from './lib/telegram';
import { queryClient } from './lib/query';
import { router } from './router';
import { api } from './lib/api';
import { useAuthStore } from './lib/auth-store';
import './index.css';

initTelegram();

const tgTheme = getTelegramColorScheme();
const tgLocale = getTelegramLocale();

/** Best-effort: persist the chosen language on the user profile when signed in. */
function syncLocale(locale: 'en' | 'ru') {
  if (!useAuthStore.getState().tokens) return;
  void api.me.update({ languageCode: locale }).catch(() => undefined);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider
      storageKey="prioritizz.miniapp.theme"
      defaultSetting={tgTheme ?? 'system'}
    >
      <I18nProvider
        storageKey="prioritizz.miniapp.locale"
        defaultLocale={tgLocale ?? 'en'}
        onLocaleChange={syncLocale}
      >
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

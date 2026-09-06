import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@prioritizz/ui';
import { I18nProvider } from '@prioritizz/i18n';
import { queryClient } from './lib/query';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider storageKey="prioritizz.admin.theme" defaultSetting="system">
      <I18nProvider storageKey="prioritizz.admin.locale" defaultLocale="en">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

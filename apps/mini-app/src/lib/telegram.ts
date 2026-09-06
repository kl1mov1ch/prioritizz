/**
 * Thin wrapper over the Telegram WebApp global. We deliberately read from the
 * injected `window.Telegram.WebApp` rather than a heavy SDK so the shell stays
 * tiny; swap for @telegram-apps/sdk if richer bindings are needed.
 */
interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { language_code?: string } } & Record<string, unknown>;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  expand(): void;
  ready(): void;
  enableClosingConfirmation(): void;
  HapticFeedback?: { impactOccurred(style: string): void };
  MainButton: {
    setText(t: string): void;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
    showProgress(): void;
    hideProgress(): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function getWebApp(): TgWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;
  wa.ready();
  wa.expand();
  wa.enableClosingConfirmation();
  // Theme is owned by <ThemeProvider>; it seeds from getTelegramColorScheme().
}

/** Telegram's current colour scheme, or null when running outside Telegram. */
export function getTelegramColorScheme(): 'light' | 'dark' | null {
  return getWebApp()?.colorScheme ?? null;
}

/** 'ru' if the Telegram client language starts with ru, else 'en', else null. */
export function getTelegramLocale(): 'en' | 'ru' | null {
  const code = getWebApp()?.initDataUnsafe?.user?.language_code;
  if (!code) return null;
  return code.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

/** initData string for the /auth/telegram call. Empty when opened outside Telegram (dev). */
export function getInitData(): string {
  return getWebApp()?.initData ?? '';
}

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  getWebApp()?.HapticFeedback?.impactOccurred(style);
}

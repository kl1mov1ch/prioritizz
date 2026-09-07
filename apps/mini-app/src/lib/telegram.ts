/**
 * Thin wrapper over the Telegram WebApp global. We deliberately read from the
 * injected `window.Telegram.WebApp` rather than a heavy SDK so the shell stays
 * tiny; swap for @telegram-apps/sdk if richer bindings are needed.
 */
import { useEffect, useState } from 'react';

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { language_code?: string; photo_url?: string } } & Record<
    string,
    unknown
  >;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  expand(): void;
  ready(): void;
  enableClosingConfirmation(): void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
  HapticFeedback?: {
    impactOccurred(style: string): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
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

export function notify(type: 'error' | 'success' | 'warning'): void {
  getWebApp()?.HapticFeedback?.notificationOccurred(type);
}

/**
 * Pixels currently hidden by the on-screen keyboard, derived from Telegram's
 * viewport events. Lets a sticky composer lift above the keyboard instead of
 * being covered — `viewportChanged` is the only signal Telegram gives for this.
 */
export function useViewportInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    const update = () => {
      const hidden = Math.max(0, Math.round(wa.viewportStableHeight - wa.viewportHeight));
      setInset(hidden);
    };
    update();
    wa.onEvent('viewportChanged', update);
    return () => wa.offEvent('viewportChanged', update);
  }, []);
  return inset;
}

/** Wire Telegram's native hardware/hitbox back button to a callback while mounted. */
export function useTelegramBackButton(onBack: () => void): void {
  useEffect(() => {
    const bb = getWebApp()?.BackButton;
    if (!bb) return;
    bb.onClick(onBack);
    bb.show();
    return () => {
      bb.offClick(onBack);
      bb.hide();
    };
  }, [onBack]);
}

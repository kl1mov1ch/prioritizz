/**
 * Thin wrapper over the Telegram WebApp global. We deliberately read from the
 * injected `window.Telegram.WebApp` rather than a heavy SDK so the shell stays
 * tiny; swap for @telegram-apps/sdk if richer bindings are needed.
 */
interface TgWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  expand(): void;
  ready(): void;
  enableClosingConfirmation(): void;
  HapticFeedback?: {
    impactOccurred(style: string): void;
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
    Telegram?: {
      WebApp?: TgWebApp;
    };
  }
}
export declare function getWebApp(): TgWebApp | null;
export declare function initTelegram(): void;
/** initData string for the /auth/telegram call. Empty when opened outside Telegram (dev). */
export declare function getInitData(): string;
export declare function haptic(style?: 'light' | 'medium' | 'heavy'): void;
export {};
//# sourceMappingURL=telegram.d.ts.map

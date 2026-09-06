export function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}
export function initTelegram() {
  const wa = getWebApp();
  if (!wa) return;
  wa.ready();
  wa.expand();
  wa.enableClosingConfirmation();
  document.documentElement.dataset.theme = wa.colorScheme;
}
/** initData string for the /auth/telegram call. Empty when opened outside Telegram (dev). */
export function getInitData() {
  return getWebApp()?.initData ?? '';
}
export function haptic(style = 'light') {
  getWebApp()?.HapticFeedback?.impactOccurred(style);
}
//# sourceMappingURL=telegram.js.map

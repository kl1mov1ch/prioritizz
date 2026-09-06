import { useEffect, useRef, useState } from 'react';

export interface TelegramWidgetUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onPrioritizzTelegramAuth?: (user: TelegramWidgetUser) => void;
  }
}

/**
 * Embeds Telegram's official Login Widget. The iframe only renders when the
 * page origin matches the domain registered with BotFather (`/setdomain`),
 * so `onUnavailable` lets the caller fall back to another sign-in path.
 */
export function TelegramLoginButton({
  botUsername,
  onAuth,
  onUnavailable,
  requestAccess = false,
}: {
  botUsername: string;
  onAuth: (user: TelegramWidgetUser) => void;
  onUnavailable?: () => void;
  requestAccess?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    window.onPrioritizzTelegramAuth = onAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'onPrioritizzTelegramAuth(user)');
    if (requestAccess) script.setAttribute('data-request-access', 'write');
    script.onerror = () => {
      setFailed(true);
      onUnavailable?.();
    };
    el.appendChild(script);

    // The widget injects an <iframe>; if none appears the domain is not
    // registered for this bot and the caller should show a fallback.
    const timer = window.setTimeout(() => {
      if (!el.querySelector('iframe')) {
        setFailed(true);
        onUnavailable?.();
      }
    }, 3500);

    return () => {
      window.clearTimeout(timer);
      delete window.onPrioritizzTelegramAuth;
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botUsername]);

  return <div ref={host} data-failed={failed} className="flex min-h-[48px] justify-center" />;
}

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { getInitData } from '../lib/telegram';
/**
 * Exchanges Telegram initData for a session on first load. If a persisted
 * session already exists we trust it and let the HTTP client refresh lazily.
 */
export function useTelegramAuth() {
  const { user, setSession } = useAuthStore();
  const [status, setStatus] = useState(user ? 'ready' : 'loading');
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((n) => n + 1), []);
  useEffect(() => {
    let cancelled = false;
    const initData = getInitData();
    if (!initData) {
      // Dev / outside Telegram: allow the app to render if we already have a session.
      setStatus(user ? 'ready' : 'error');
      return;
    }
    setStatus('loading');
    api.auth
      .telegram(initData)
      .then((res) => {
        if (cancelled) return;
        setSession(res.user, res.tokens);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  return { status, user, retry };
}
//# sourceMappingURL=useTelegramAuth.js.map

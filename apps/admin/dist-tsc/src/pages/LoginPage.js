import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@prioritizz/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
/**
 * Admin login. In production this page is opened as a Telegram Mini App for
 * allowlisted operator accounts; initData is posted to /auth/admin/login.
 * For local dev you can paste an initData string.
 */
export default function LoginPage() {
  const [initData, setInitData] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.adminLogin({ initData: initData || undefined });
      setSession(res.user, res.tokens);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return _jsx('div', {
    className: 'flex h-full items-center justify-center p-6',
    children: _jsxs(Card, {
      className: 'w-full max-w-sm p-6',
      children: [
        _jsx('h1', { className: 'mb-1 text-lg font-semibold', children: 'Prioritizz Admin' }),
        _jsx('p', {
          className: 'mb-4 text-sm text-muted-foreground',
          children: 'Sign in with your allowlisted Telegram operator account.',
        }),
        _jsx('textarea', {
          value: initData,
          onChange: (e) => setInitData(e.target.value),
          placeholder: 'Telegram initData (dev)',
          className: 'mb-3 h-24 w-full rounded-md border bg-background p-2 text-xs',
        }),
        error && _jsx('p', { className: 'mb-2 text-sm text-destructive', children: error }),
        _jsx(Button, { size: 'block', loading: loading, onClick: submit, children: 'Sign in' }),
      ],
    }),
  });
}
//# sourceMappingURL=LoginPage.js.map

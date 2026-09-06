import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ThemeToggle } from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

/**
 * Admin login. In production this page is opened as a Telegram Mini App for
 * allowlisted operator accounts; initData is posted to /auth/admin/login.
 * For local dev you can paste an initData string.
 */
export default function LoginPage() {
  const t = useT();
  const [initData, setInitData] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center p-6">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
      </div>
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-lg font-semibold">{t('auth.adminTitle')}</h1>
        <p className="mb-4 text-sm text-muted-foreground">{t('auth.adminSubtitle')}</p>
        <textarea
          value={initData}
          onChange={(e) => setInitData(e.target.value)}
          placeholder={t('auth.initDataPlaceholder')}
          className="mb-3 h-24 w-full rounded-md border bg-background p-2 text-xs"
        />
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        <Button size="block" loading={loading} onClick={submit}>
          {t('common.signIn')}
        </Button>
      </Card>
    </div>
  );
}

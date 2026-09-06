import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Field,
  Textarea,
  ThemeToggle,
  IconShield,
  IconAlert,
  IconArrowRight,
} from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { ApiClientError } from '@prioritizz/api-client';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

/**
 * Admin sign-in. In production the page is opened as a Telegram Mini App by an
 * allowlisted operator and `initData` arrives from the client; the textarea is
 * the local-dev path for pasting a signed payload by hand.
 */
export default function LoginPage() {
  const t = useT();
  const [initData, setInitData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.adminLogin({ initData: initData.trim() || undefined });
      setSession(res.user, res.tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiClientError ? `${err.code} — ${err.message}` : (err as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center p-5">
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
      </div>

      {/* Sheet: thick material, 20px corners, no border, no shadow */}
      <form
        onSubmit={submit}
        className="material-thick w-full max-w-[420px] animate-fade-up rounded-3xl p-8"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <IconShield size={24} />
        </span>

        <h1 className="mt-5 font-display text-title1 font-semibold">{t('auth.adminTitle')}</h1>
        <p className="mt-1.5 text-subhead text-muted">{t('auth.adminSubtitle')}</p>

        <div className="mt-6">
          <Field
            label={t('auth.initDataLabel')}
            hint={t('auth.initDataHint')}
            htmlFor="initData"
            error={error ?? undefined}
          >
            <Textarea
              id="initData"
              name="initData"
              value={initData}
              onChange={(e) => setInitData(e.target.value)}
              placeholder={t('auth.initDataPlaceholder')}
              spellCheck={false}
              autoComplete="off"
              rows={4}
              className="font-mono text-footnote"
              aria-invalid={!!error}
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-tint-red/[0.1] p-3 text-footnote text-tint-red">
            <IconAlert size={15} className="mt-px shrink-0" />
            <span className="break-words">{error}</span>
          </p>
        )}

        <Button type="submit" size="block" loading={loading} className="mt-6">
          {t('common.signIn')}
          {!loading && <IconArrowRight size={17} />}
        </Button>

        <p className="mt-5 border-t border-separator pt-4 text-caption text-subtle">
          {t('auth.allowlistNote')}
        </p>
      </form>
    </div>
  );
}

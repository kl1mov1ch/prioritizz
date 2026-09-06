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
import { TelegramLoginButton, type TelegramWidgetUser } from '../components/TelegramLoginButton';

const BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? '';

/**
 * Admin sign-in. Primary path is Telegram's Login Widget; pasting Mini App
 * initData stays available for local dev where the bot domain is not
 * registered with BotFather. Both land on the same allowlist check.
 */
export default function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [initData, setInitData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [widgetDown, setWidgetDown] = useState(false);

  function fail(err: unknown) {
    setError(err instanceof ApiClientError ? `${err.code} — ${err.message}` : (err as Error).message);
  }

  async function onWidgetAuth(user: TelegramWidgetUser) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.adminTelegramWidget(user as unknown as Record<string, unknown>);
      setSession(res.user, res.tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitInitData(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.adminLogin({ initData: initData.trim() || undefined });
      setSession(res.user, res.tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      fail(err);
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

      <div className="material-thick w-full max-w-[420px] animate-fade-up rounded-3xl p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <IconShield size={24} />
        </span>

        <h1 className="mt-5 font-display text-title1 font-semibold">{t('auth.adminTitle')}</h1>
        <p className="mt-1.5 text-subhead text-muted">{t('auth.adminSubtitle')}</p>

        {/* Primary: Telegram Login Widget */}
        {BOT && (
          <div className="mt-6">
            <TelegramLoginButton
              botUsername={BOT}
              onAuth={onWidgetAuth}
              onUnavailable={() => setWidgetDown(true)}
            />
            {widgetDown && (
              <p className="mt-2 text-center text-caption text-subtle">
                {t('auth.widgetUnavailable')}
              </p>
            )}
          </div>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-separator" />
          <span className="text-caption uppercase tracking-wide text-subtle">
            {t('auth.orDivider')}
          </span>
          <span className="h-px flex-1 bg-separator" />
        </div>

        {/* Fallback: paste signed initData */}
        <form onSubmit={submitInitData}>
          <Field
            label={t('auth.initDataLabel')}
            hint={t('auth.initDataHint')}
            htmlFor="initData"
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

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-tint-red/[0.1] p-3 text-footnote text-tint-red">
              <IconAlert size={15} className="mt-px shrink-0" />
              <span className="break-words">{error}</span>
            </p>
          )}

          <Button
            type="submit"
            variant="bordered"
            size="block"
            loading={loading}
            disabled={!initData.trim()}
            className="mt-5"
          >
            {t('common.signIn')}
            {!loading && <IconArrowRight size={17} />}
          </Button>
        </form>

        <p className="mt-6 border-t border-separator pt-4 text-caption text-subtle">
          {t('auth.allowlistNote')}
        </p>
      </div>
    </div>
  );
}

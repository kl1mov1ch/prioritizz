import { useQuery } from '@tanstack/react-query';
import {
  Card,
  LoadingState,
  formatMoney,
  ThemeToggle,
  IconWallet,
  IconSparkles,
  IconGlobe,
  IconSun,
} from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function ProfilePage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>

      <Card className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg font-bold text-primary-foreground shadow-glow">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-sm text-muted-foreground">@{user?.username ?? '—'}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(user?.roles ?? []).map((r) => (
              <span key={r} className="chip !py-0.5 !text-[0.62rem]">
                {r}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <IconWallet size={16} className="text-primary" /> {t('profile.wallet')}
        </p>
        {wallet.isLoading ? (
          <LoadingState label={t('common.loading')} />
        ) : wallet.data ? (
          <dl className="space-y-2 text-sm">
            <Row
              k={t('profile.available')}
              v={formatMoney(wallet.data.available, wallet.data.currency)}
              strong
            />
            <Row
              k={t('profile.pending')}
              v={formatMoney(wallet.data.pending, wallet.data.currency)}
            />
            <Row
              k={t('profile.inEscrow')}
              v={formatMoney(wallet.data.inEscrow, wallet.data.currency)}
            />
          </dl>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold">{t('profile.settings')}</p>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <IconGlobe size={16} /> {t('common.language')}
          </span>
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <IconSun size={16} /> {t('common.theme')}
          </span>
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </div>
      </Card>

      {!user?.isSeller && (
        <Card className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <IconSparkles size={16} className="text-primary" /> {t('profile.becomeSeller')}
          </p>
          <p className="text-sm text-muted-foreground">{t('profile.becomeSellerDesc')}</p>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={strong ? 'text-base font-bold' : 'font-medium'}>{v}</dd>
    </div>
  );
}

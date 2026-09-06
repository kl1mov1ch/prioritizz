import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, formatMoney, ThemeToggle } from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function ProfilePage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('profile.title')}</h1>

      <Card className="p-4">
        <p className="font-medium">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-muted-foreground">@{user?.username ?? '—'}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('profile.roles')}: {user?.roles.join(', ')}
        </p>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">{t('profile.wallet')}</p>
        {wallet.isLoading ? (
          <LoadingState label={t('common.loading')} />
        ) : wallet.data ? (
          <dl className="space-y-1 text-sm">
            <Row
              k={t('profile.available')}
              v={formatMoney(wallet.data.available, wallet.data.currency)}
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

      <Card className="p-4">
        <p className="mb-3 text-sm font-medium">{t('profile.settings')}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('common.language')}</span>
          <LanguageToggle />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('common.theme')}</span>
          <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
        </div>
      </Card>

      {!user?.isSeller && (
        <Card className="p-4">
          <p className="text-sm font-medium">{t('profile.becomeSeller')}</p>
          <p className="text-sm text-muted-foreground">{t('profile.becomeSellerDesc')}</p>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

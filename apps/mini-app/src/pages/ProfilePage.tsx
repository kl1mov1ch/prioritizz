import { useQuery } from '@tanstack/react-query';
import {
  Card,
  GroupedList,
  GroupedRow,
  LoadingState,
  formatMoney,
  ThemeToggle,
  IconSparkles,
  IconChevronRight,
} from '@prioritizz/ui';
import { useT, LanguageToggle } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function ProfilePage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-4">
      <h1 className="title-large">{t('profile.title')}</h1>

      <Card className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary font-display text-title3 font-semibold text-primary-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-subhead text-muted">@{user?.username ?? '—'}</p>
          <p className="mt-0.5 truncate text-caption text-subtle">
            {t('profile.roles')}: {user?.roles.join(', ')}
          </p>
        </div>
      </Card>

      <Card flush className="overflow-hidden">
        <p className="px-4 pb-2 pt-4 text-footnote font-semibold text-muted md:px-5">
          {t('profile.wallet')}
        </p>
        {wallet.isLoading ? (
          <div className="pb-4">
            <LoadingState label={t('common.loading')} />
          </div>
        ) : wallet.data ? (
          <GroupedList className="rounded-none bg-transparent">
            <GroupedRow>
              <span className="text-subhead text-muted">{t('profile.available')}</span>
              <span className="text-body font-semibold">
                {formatMoney(wallet.data.available, wallet.data.currency)}
              </span>
            </GroupedRow>
            <GroupedRow>
              <span className="text-subhead text-muted">{t('profile.pending')}</span>
              <span className="text-subhead">
                {formatMoney(wallet.data.pending, wallet.data.currency)}
              </span>
            </GroupedRow>
            <GroupedRow>
              <span className="text-subhead text-muted">{t('profile.inEscrow')}</span>
              <span className="text-subhead">
                {formatMoney(wallet.data.inEscrow, wallet.data.currency)}
              </span>
            </GroupedRow>
          </GroupedList>
        ) : null}
      </Card>

      <Card flush className="overflow-hidden">
        <p className="px-4 pb-2 pt-4 text-footnote font-semibold text-muted md:px-5">
          {t('profile.settings')}
        </p>
        <GroupedList className="rounded-none bg-transparent">
          <GroupedRow>
            <span className="text-subhead">{t('common.language')}</span>
            <LanguageToggle />
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead">{t('common.theme')}</span>
            <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
          </GroupedRow>
        </GroupedList>
      </Card>

      {!user?.isSeller && (
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.12] text-primary">
            <IconSparkles size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-subhead font-semibold">{t('profile.becomeSeller')}</p>
            <p className="text-footnote text-muted">{t('profile.becomeSellerDesc')}</p>
          </div>
          <IconChevronRight size={16} className="shrink-0 text-subtle" />
        </Card>
      )}
    </div>
  );
}

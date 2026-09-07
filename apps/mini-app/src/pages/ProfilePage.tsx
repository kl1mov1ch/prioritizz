import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Card,
  GroupedList,
  GroupedRow,
  LoadingState,
  initialsOf,
  formatMoney,
  IconSparkles,
  IconChevronRight,
  IconStorefront,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });

  return (
    <div className="space-y-4">
      <h1 className="title-large">{t('profile.title')}</h1>

      <Link to="/settings" className="group block">
        <Card className="flex items-center gap-4 transition-transform duration-150 group-active:scale-[0.99]">
          <Avatar
            src={user?.photoUrl}
            initials={initialsOf(user?.firstName, user?.lastName)}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-subhead text-muted">@{user?.username ?? '—'}</p>
            <p className="mt-0.5 truncate text-caption text-subtle">{t('profile.edit')}</p>
          </div>
          <IconChevronRight size={16} className="shrink-0 text-subtle" />
        </Card>
      </Link>

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

      {user?.isSeller ? (
        <Link to="/sell" className="group block">
          <Card className="flex items-center gap-3 transition-transform duration-150 group-active:scale-[0.99]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.12] text-primary">
              <IconStorefront size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-subhead font-semibold">{t('seller.myListings')}</p>
              <p className="text-footnote text-muted">{t('seller.becomeSubtitle')}</p>
            </div>
            <IconChevronRight size={16} className="shrink-0 text-subtle" />
          </Card>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/sell/start')}
          className="group block w-full text-left"
        >
          <Card className="flex items-center gap-3 transition-transform duration-150 group-active:scale-[0.99]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.12] text-primary">
              <IconSparkles size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-subhead font-semibold">{t('profile.becomeSeller')}</p>
              <p className="text-footnote text-muted">{t('profile.becomeSellerDesc')}</p>
            </div>
            <IconChevronRight size={16} className="shrink-0 text-subtle" />
          </Card>
        </button>
      )}
    </div>
  );
}

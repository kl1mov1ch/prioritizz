import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Rating,
  SkeletonList,
  formatMoney,
  IconPlus,
  IconPencil,
  IconStorefront,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING_REVIEW: 'warning',
  DRAFT: 'secondary',
  PAUSED: 'secondary',
  REJECTED: 'destructive',
  ARCHIVED: 'secondary',
};

export default function SellerListingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const listings = useQuery({
    queryKey: ['my-services'],
    queryFn: () => api.catalog.myServices({ pageSize: 50 }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => api.catalog.submitService(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['my-services'] }),
  });

  const items = listings.data?.items ?? [];
  const totalSold = items.reduce((n, s) => n + (s.soldCount ?? 0), 0);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="title-large truncate">{t('seller.myListings')}</h1>
          <p className="subhead truncate">{user?.firstName}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/sell/new')}>
          <IconPlus size={15} />
          {t('seller.newListing')}
        </Button>
      </header>

      <Card className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-title3 font-semibold">{items.length}</p>
          <p className="text-caption text-subtle">{t('seller.listings')}</p>
        </div>
        <div>
          <p className="text-title3 font-semibold">{totalSold}</p>
          <p className="text-caption text-subtle">{t('seller.sales')}</p>
        </div>
        <div>
          <p className="text-title3 font-semibold">
            {items.length
              ? (items.reduce((n, s) => n + s.ratingAvg, 0) / items.length).toFixed(1)
              : '—'}
          </p>
          <p className="text-caption text-subtle">{t('seller.rating')}</p>
        </div>
      </Card>

      {listings.isLoading && <SkeletonList count={3} />}
      {listings.isError && (
        <ErrorState
          title={t('common.somethingWrong')}
          onRetry={() => listings.refetch()}
          retryLabel={t('common.retry')}
        />
      )}
      {listings.isSuccess && items.length === 0 && (
        <EmptyState
          icon={<IconStorefront size={22} />}
          title={t('seller.noListings')}
          description={t('seller.noListingsDesc')}
          action={<Button onClick={() => navigate('/sell/new')}>{t('seller.newListing')}</Button>}
        />
      )}

      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id}>
            <Card className="space-y-3">
              <div className="flex items-start gap-3">
                {s.media[0] ? (
                  <img
                    src={s.media[0].url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-grouped text-subtle">
                    <IconStorefront size={20} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-subhead font-semibold">{s.title}</p>
                  <p className="truncate text-caption text-subtle">
                    {formatMoney(s.basePriceAmount, s.currency)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_TONE[s.status] ?? 'secondary'}>{s.status}</Badge>
                    {s.ratingCount > 0 && <Rating value={s.ratingAvg} size={12} />}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="grouped"
                  className="flex-1"
                  onClick={() => navigate(`/sell/${s.id}/edit`)}
                >
                  <IconPencil size={14} />
                  {t('seller.edit')}
                </Button>
                {s.status !== 'ACTIVE' && (
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={publish.isPending && publish.variables === s.id}
                    onClick={() => publish.mutate(s.id)}
                  >
                    {t('seller.publish')}
                  </Button>
                )}
                {s.status === 'ACTIVE' && (
                  <Link to={`/catalog/${s.slug}`} className="flex-1">
                    <Button size="sm" variant="grouped" className="w-full">
                      {t('common.search')}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

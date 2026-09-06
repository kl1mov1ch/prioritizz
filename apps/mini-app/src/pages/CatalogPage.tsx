import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  formatMoney,
  IconSearch,
  IconStar,
  IconShield,
  IconClock,
  IconArrowRight,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { CategoryIcon } from '../lib/category-icons';

export default function CatalogPage() {
  const t = useT();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.catalog.categories() });
  const services = useQuery({
    queryKey: ['services', { q, categoryId }],
    queryFn: () => api.catalog.listServices({ q: q || undefined, categoryId, pageSize: 20 }),
  });

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">{t('common.appName')}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{t('common.tagline')}</p>
      </header>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        icon={<IconSearch size={17} />}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <button
          type="button"
          className="chip"
          data-active={!categoryId}
          onClick={() => setCategoryId(undefined)}
        >
          {t('common.all')}
        </button>
        {(categories.data ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            data-active={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
          >
            <CategoryIcon slug={c.slug} />
            {c.name}
          </button>
        ))}
      </div>

      {services.isLoading && <LoadingState label={t('common.loading')} />}
      {services.isError && (
        <ErrorState
          title={t('common.somethingWrong')}
          onRetry={() => services.refetch()}
          retryLabel={t('common.retry')}
        />
      )}
      {services.data?.items.length === 0 && (
        <EmptyState title={t('catalog.emptyTitle')} description={t('catalog.emptyDesc')} />
      )}

      <ul className="space-y-3">
        {services.data?.items.map((s) => (
          <li key={s.id}>
            <Link to={`/catalog/${s.slug}`} className="group block">
              <Card className="p-4 transition-transform duration-200 group-active:scale-[0.985]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate font-semibold">{s.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{s.summary}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="chip !py-1 !text-[0.68rem]">{s.category.name}</span>
                      <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-warning">
                        <IconStar size={13} /> {s.ratingAvg.toFixed(1)}
                      </span>
                      {s.seller.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-success">
                          <IconShield size={13} /> {t('catalog.verified')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold">
                      {formatMoney(s.basePriceAmount, s.currency)}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                      <IconClock size={12} /> {t('catalog.hours', { n: s.slaHours })}
                    </p>
                    <IconArrowRight
                      size={16}
                      className="ml-auto mt-2 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

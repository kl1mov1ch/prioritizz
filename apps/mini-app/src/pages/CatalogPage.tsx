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
  IconChevronRight,
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
        <h1 className="title-large">{t('common.appName')}</h1>
        <p className="subhead">{t('common.tagline')}</p>
      </header>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        icon={<IconSearch size={17} />}
        aria-label={t('common.search')}
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
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
              <Card className="transition-transform duration-150 group-active:scale-[0.99]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-body font-semibold">{s.title}</p>
                    <p className="line-clamp-2 text-footnote text-muted">{s.summary}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-caption font-medium text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <CategoryIcon slug={s.category.slug} size={12} />
                        {s.category.name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IconStar size={12} /> {s.ratingAvg.toFixed(1)}
                      </span>
                      {s.seller.isVerified && (
                        <span className="inline-flex items-center gap-1 text-tint-green">
                          <IconShield size={12} /> {t('catalog.verified')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-title3 font-semibold">
                      {formatMoney(s.basePriceAmount, s.currency)}
                    </p>
                    <p className="inline-flex items-center gap-1 text-caption text-subtle">
                      <IconClock size={12} /> {t('catalog.hours', { n: s.slaHours })}
                    </p>
                    <IconChevronRight
                      size={16}
                      className="mt-1 text-subtle transition-transform group-hover:translate-x-0.5"
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

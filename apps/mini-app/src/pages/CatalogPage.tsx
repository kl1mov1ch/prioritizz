import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, ErrorState, LoadingState, formatMoney } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';

export default function CatalogPage() {
  const t = useT();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const services = useQuery({
    queryKey: ['services', { q, categoryId }],
    queryFn: () => api.catalog.listServices({ q: q || undefined, categoryId, pageSize: 20 }),
  });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('common.appName')}</h1>
        <p className="text-sm text-muted-foreground">{t('common.tagline')}</p>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryId(undefined)}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs ${!categoryId ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {t('common.all')}
        </button>
        {(categories.data ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${categoryId === c.id ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {services.isLoading && <LoadingState label={t('common.loading')} />}
      {services.isError && (
        <ErrorState title={t('common.somethingWrong')} onRetry={() => services.refetch()} />
      )}
      {services.data?.items.length === 0 && (
        <EmptyState title={t('catalog.emptyTitle')} description={t('catalog.emptyDesc')} />
      )}

      <ul className="space-y-3">
        {services.data?.items.map((s) => (
          <li key={s.id}>
            <Link to={`/catalog/${s.slug}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{s.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{s.category.name}</Badge>
                      {s.seller.isVerified && (
                        <Badge variant="success">{t('catalog.verified')}</Badge>
                      )}
                      <Badge variant="outline">★ {s.ratingAvg.toFixed(1)}</Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{formatMoney(s.basePriceAmount, s.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('catalog.hours', { n: s.slaHours })}
                    </p>
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

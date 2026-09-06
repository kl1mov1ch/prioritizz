import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, IconPercent } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';

export default function CommissionsPage() {
  const t = useT();
  const q = useQuery({
    queryKey: ['admin', 'commission-rules'],
    queryFn: () => api.admin.commissionRules(),
  });

  return (
    <div className="space-y-5">
      <h1 className="title-1">{t('admin.commissionRules')}</h1>
      {q.isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/[0.12] text-primary">
                  <IconPercent size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-subhead font-semibold">{r.name}</p>
                  <p className="truncate text-caption text-subtle">
                    {r.scope} · {t('admin.priority')} {r.priority} · {JSON.stringify(r.matcher)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-display text-title2 font-semibold tabular-nums">
                {(r.percentBps / 100).toFixed(2)}%
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

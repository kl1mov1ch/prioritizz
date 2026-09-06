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
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{t('admin.commissionRules')}</h1>
      {q.isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--glass-bg))] text-primary">
                  <IconPercent size={16} />
                </span>
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.scope} · {t('admin.priority')} {r.priority} · {JSON.stringify(r.matcher)}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-gradient">
                {(r.percentBps / 100).toFixed(2)}%
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

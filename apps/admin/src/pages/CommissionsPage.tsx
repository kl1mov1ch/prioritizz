import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState } from '@prioritizz/ui';
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
      <h1 className="text-xl font-semibold">{t('admin.commissionRules')}</h1>
      {q.isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.scope} · {t('admin.priority')} {r.priority} · {JSON.stringify(r.matcher)}
                </p>
              </div>
              <span className="font-semibold">{(r.percentBps / 100).toFixed(2)}%</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

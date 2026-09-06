import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState } from '@prioritizz/ui';
import { api } from '../lib/api';

export default function CommissionsPage() {
  const q = useQuery({
    queryKey: ['admin', 'commission-rules'],
    queryFn: () => api.admin.commissionRules(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Commission rules</h1>
      {q.isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.scope} · priority {r.priority} · {JSON.stringify(r.matcher)}
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

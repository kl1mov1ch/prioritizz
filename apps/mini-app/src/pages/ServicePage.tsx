import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, LoadingState, formatMoney } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

export default function ServicePage() {
  const t = useT();
  const { idOrSlug = '' } = useParams();
  const navigate = useNavigate();

  const service = useQuery({
    queryKey: ['service', idOrSlug],
    queryFn: () => api.catalog.getService(idOrSlug),
  });

  const createOrder = useMutation({
    mutationFn: () =>
      api.orders.create({ serviceId: service.data!.id, quantity: 1 }, crypto.randomUUID()),
    onSuccess: (order) => {
      haptic('medium');
      navigate(`/orders/${order.id}`);
    },
  });

  if (service.isLoading) return <LoadingState label={t('common.loading')} />;
  if (service.isError || !service.data)
    return <ErrorState title={t('common.somethingWrong')} onRetry={() => service.refetch()} />;

  const s = service.data;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground">
        ← {t('common.back')}
      </button>

      <div className="space-y-2">
        <h1 className="text-lg font-semibold">{s.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{s.category.name}</Badge>
          <Badge variant="outline">{s.kind}</Badge>
          <Badge variant="outline">{t('service.sla', { n: s.slaHours })}</Badge>
        </div>
      </div>

      <Card className="p-4">
        <p className="whitespace-pre-wrap text-sm">{s.description}</p>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-medium">{t('service.seller')}</p>
        <p className="text-sm text-muted-foreground">
          {s.seller.displayName} · ★ {s.seller.ratingAvg.toFixed(1)} · {s.seller.tier}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-medium">{t('service.refundPolicy')}</p>
        <p className="text-sm text-muted-foreground">{s.refundPolicy}</p>
      </Card>

      <div className="sticky bottom-24 rounded-lg border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('service.toPay')}</span>
          <span className="text-lg font-semibold">
            {formatMoney(s.basePriceAmount, s.currency)}
          </span>
        </div>
        <Button size="block" loading={createOrder.isPending} onClick={() => createOrder.mutate()}>
          {t('service.buyWithGuarantee')}
        </Button>
        {createOrder.isError && (
          <p className="mt-2 text-xs text-destructive">{(createOrder.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}

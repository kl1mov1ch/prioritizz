import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  formatMoney,
  IconChevronLeft,
  IconStar,
  IconClock,
  IconShield,
} from '@prioritizz/ui';
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
    return (
      <ErrorState
        title={t('common.somethingWrong')}
        onRetry={() => service.refetch()}
        retryLabel={t('common.retry')}
      />
    );

  const s = service.data;

  return (
    <div className="space-y-4 pb-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconChevronLeft size={16} /> {t('common.back')}
      </button>

      <div className="space-y-2.5">
        <h1 className="text-xl font-bold leading-tight">{s.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold">
          <span className="chip !py-1">{s.category.name}</span>
          <span className="chip !py-1">{s.kind}</span>
          <span className="inline-flex items-center gap-1 text-warning">
            <IconStar size={13} /> {s.seller.ratingAvg.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <IconClock size={13} /> {t('service.sla', { n: s.slaHours })}
          </span>
        </div>
      </div>

      <Card>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.description}</p>
      </Card>

      <Card className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <IconShield size={16} className="text-primary" /> {t('service.seller')}
        </p>
        <p className="text-sm text-muted-foreground">
          {s.seller.displayName} · ★ {s.seller.ratingAvg.toFixed(1)} · {s.seller.tier}
        </p>
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-semibold">{t('service.refundPolicy')}</p>
        <p className="text-sm text-muted-foreground">{s.refundPolicy}</p>
      </Card>

      <div className="glass-strong sticky bottom-24 z-10 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('service.toPay')}</span>
          <span className="text-xl font-bold">{formatMoney(s.basePriceAmount, s.currency)}</span>
        </div>
        <Button size="block" loading={createOrder.isPending} onClick={() => createOrder.mutate()}>
          <IconShield size={17} /> {t('service.buyWithGuarantee')}
        </Button>
        {createOrder.isError && (
          <p className="mt-2 text-xs text-destructive">{(createOrder.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}

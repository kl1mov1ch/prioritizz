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
import { CategoryIcon } from '../lib/category-icons';
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
        type="button"
        onClick={() => navigate(-1)}
        className="-ml-2 inline-flex min-h-touch items-center gap-0.5 rounded-lg px-2 text-body font-medium text-primary transition-colors hover:bg-primary/[0.07]"
      >
        <IconChevronLeft size={18} /> {t('common.back')}
      </button>

      <div className="space-y-2.5">
        <h1 className="title-1">{s.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-footnote text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <CategoryIcon slug={s.category.slug} size={14} />
            {s.category.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconStar size={14} /> {s.seller.ratingAvg.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock size={14} /> {t('service.sla', { n: s.slaHours })}
          </span>
        </div>
      </div>

      <Card>
        <p className="whitespace-pre-wrap text-subhead leading-relaxed">{s.description}</p>
      </Card>

      <Card className="space-y-1">
        <p className="inline-flex items-center gap-2 text-footnote font-semibold text-muted">
          <IconShield size={15} className="text-primary" /> {t('service.seller')}
        </p>
        <p className="text-subhead">
          {s.seller.displayName}
          <span className="text-subtle">
            {' '}
            · {s.seller.ratingAvg.toFixed(1)} · {s.seller.tier}
          </span>
        </p>
      </Card>

      <Card className="space-y-1">
        <p className="text-footnote font-semibold text-muted">{t('service.refundPolicy')}</p>
        <p className="text-subhead">{s.refundPolicy}</p>
      </Card>

      {/* Checkout sheet: thick material, rounded top, floats above content */}
      <div className="material-thick sticky bottom-28 z-10 rounded-3xl p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-subhead text-muted">{t('service.toPay')}</span>
          <span className="font-display text-title1 font-semibold">
            {formatMoney(s.basePriceAmount, s.currency)}
          </span>
        </div>
        <Button size="block" loading={createOrder.isPending} onClick={() => createOrder.mutate()}>
          {t('service.buyWithGuarantee')}
        </Button>
        {createOrder.isError && (
          <p className="mt-2 text-footnote text-tint-red">
            {(createOrder.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

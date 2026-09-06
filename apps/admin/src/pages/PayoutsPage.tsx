import { EmptyState, IconCard } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/payouts + approve/reject in M6. */
export default function PayoutsPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="title-1">{t('nav.payouts')}</h1>
      <EmptyState
        title={t('nav.payouts')}
        description={t('admin.payoutsSoon')}
        icon={<IconCard size={22} />}
      />
    </div>
  );
}

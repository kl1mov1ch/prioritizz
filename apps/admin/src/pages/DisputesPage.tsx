import { EmptyState, IconGavel } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/disputes + resolve action in M5/M8. */
export default function DisputesPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{t('nav.disputes')}</h1>
      <EmptyState
        title={t('nav.disputes')}
        description={t('admin.disputesSoon')}
        icon={<IconGavel size={22} />}
      />
    </div>
  );
}

import { Card } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/disputes + resolve action in M5/M8. */
export default function DisputesPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('nav.disputes')}</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        {t('admin.disputesSoon')} <code>POST /api/v1/admin/disputes/:id/resolve</code>.
      </Card>
    </div>
  );
}

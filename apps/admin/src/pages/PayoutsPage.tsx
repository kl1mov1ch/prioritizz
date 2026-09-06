import { Card } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/payouts + approve/reject in M6. */
export default function PayoutsPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('nav.payouts')}</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        {t('admin.payoutsSoon')} <code>POST /api/v1/admin/payouts/:id/decision</code>.
      </Card>
    </div>
  );
}

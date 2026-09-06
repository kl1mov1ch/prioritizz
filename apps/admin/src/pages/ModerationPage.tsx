import { Card } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/services?moderationStatus=PENDING in M8. */
export default function ModerationPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('admin.moderationQueue')}</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        {t('admin.moderationSoon')}{' '}
        <code>POST /api/v1/admin/services/:id/moderate</code>.
      </Card>
    </div>
  );
}

import { EmptyState, IconLayers } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

/** Placeholder — wired to /admin/services?moderationStatus=PENDING in M8. */
export default function ModerationPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="title-1">{t('admin.moderationQueue')}</h1>
      <EmptyState
        title={t('nav.moderation')}
        description={t('admin.moderationSoon')}
        icon={<IconLayers size={22} />}
      />
    </div>
  );
}

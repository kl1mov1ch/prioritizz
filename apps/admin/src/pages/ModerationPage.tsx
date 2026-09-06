import { Card } from '@prioritizz/ui';

/** Placeholder — wired to /admin/services?moderationStatus=PENDING in M8. */
export default function ModerationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Moderation queue</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Listing moderation UI (approve / reject / escalate) lands in milestone M8. Backend endpoint:{' '}
        <code>POST /api/v1/admin/services/:id/moderate</code>.
      </Card>
    </div>
  );
}

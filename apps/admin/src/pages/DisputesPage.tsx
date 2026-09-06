import { Card } from '@prioritizz/ui';

/** Placeholder — wired to /admin/disputes + resolve action in M5/M8. */
export default function DisputesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Disputes</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Dispute review & resolution (release / refund / split) lands in M5. Backend:{' '}
        <code>POST /api/v1/admin/disputes/:id/resolve</code>.
      </Card>
    </div>
  );
}

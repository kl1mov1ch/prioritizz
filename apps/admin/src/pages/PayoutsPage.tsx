import { Card } from '@prioritizz/ui';

/** Placeholder — wired to /admin/payouts + approve/reject in M6. */
export default function PayoutsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payouts</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Payout approval queue lands in M6. Backend:{' '}
        <code>POST /api/v1/admin/payouts/:id/decision</code>.
      </Card>
    </div>
  );
}

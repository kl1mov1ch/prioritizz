import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, formatMoney } from '@prioritizz/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => api.me.wallet() });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Профиль</h1>

      <Card className="p-4">
        <p className="font-medium">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-muted-foreground">@{user?.username ?? '—'}</p>
        <p className="mt-1 text-xs text-muted-foreground">Роли: {user?.roles.join(', ')}</p>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">Кошелёк</p>
        {wallet.isLoading ? (
          <LoadingState />
        ) : wallet.data ? (
          <dl className="space-y-1 text-sm">
            <Row k="Доступно" v={formatMoney(wallet.data.available, wallet.data.currency)} />
            <Row k="В ожидании" v={formatMoney(wallet.data.pending, wallet.data.currency)} />
            <Row k="В сделках" v={formatMoney(wallet.data.inEscrow, wallet.data.currency)} />
          </dl>
        ) : null}
      </Card>

      {!user?.isSeller && (
        <Card className="p-4">
          <p className="text-sm font-medium">Стать продавцом</p>
          <p className="text-sm text-muted-foreground">
            Создавайте офферы и продавайте услуги с гарантией платформы.
          </p>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

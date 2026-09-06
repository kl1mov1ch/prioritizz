import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Input, IconSearch } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { DataTable } from '../components/DataTable';

export default function UsersPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'users', page, q],
    queryFn: () => api.admin.users({ page, pageSize: 20, q: q || undefined }),
  });

  const columns = useMemo<ColumnDef<any, unknown>[]>(
    () => [
      { header: t('admin.user'), accessorFn: (r) => r.username ?? r.firstName ?? r.id, id: 'name' },
      { header: t('admin.telegramId'), accessorKey: 'telegramId' },
      {
        header: t('admin.rolesCol'),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((r: string) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: t('admin.statusCol'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'destructive'}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{t('nav.users')}</h1>
      <Input
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
        placeholder={t('admin.searchUsers')}
        icon={<IconSearch size={16} />}
        className="max-w-xs"
      />
      <DataTable
        data={query.data?.items ?? []}
        columns={columns}
        isLoading={query.isLoading}
        page={page}
        pageSize={20}
        total={query.data?.total ?? 0}
        onPage={setPage}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@prioritizz/ui';
import { api } from '../lib/api';
import { DataTable } from '../components/DataTable';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'users', page, q],
    queryFn: () => api.admin.users({ page, pageSize: 20, q: q || undefined }),
  });

  const columns = useMemo<ColumnDef<any, unknown>[]>(
    () => [
      { header: 'User', accessorFn: (r) => r.username ?? r.firstName ?? r.id, id: 'name' },
      { header: 'Telegram ID', accessorKey: 'telegramId' },
      {
        header: 'Roles',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.roles.map((r: string) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'destructive'}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <input
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
        placeholder="Search username / id"
        className="w-64 rounded-md border bg-background px-3 py-2 text-sm"
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

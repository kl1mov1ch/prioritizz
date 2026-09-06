import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const columns = useMemo(
    () => [
      { header: 'User', accessorFn: (r) => r.username ?? r.firstName ?? r.id, id: 'name' },
      { header: 'Telegram ID', accessorKey: 'telegramId' },
      {
        header: 'Roles',
        cell: ({ row }) =>
          _jsx('div', {
            className: 'flex gap-1',
            children: row.original.roles.map((r) =>
              _jsx(Badge, { variant: 'secondary', children: r }, r),
            ),
          }),
      },
      {
        header: 'Status',
        cell: ({ row }) =>
          _jsx(Badge, {
            variant: row.original.status === 'ACTIVE' ? 'success' : 'destructive',
            children: row.original.status,
          }),
      },
    ],
    [],
  );
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsx('h1', { className: 'text-xl font-semibold', children: 'Users' }),
      _jsx('input', {
        value: q,
        onChange: (e) => {
          setPage(1);
          setQ(e.target.value);
        },
        placeholder: 'Search username / id',
        className: 'w-64 rounded-md border bg-background px-3 py-2 text-sm',
      }),
      _jsx(DataTable, {
        data: query.data?.items ?? [],
        columns: columns,
        isLoading: query.isLoading,
        page: page,
        pageSize: 20,
        total: query.data?.total ?? 0,
        onPage: setPage,
      }),
    ],
  });
}
//# sourceMappingURL=UsersPage.js.map

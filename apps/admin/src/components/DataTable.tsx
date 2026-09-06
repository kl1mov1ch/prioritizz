import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { LoadingState, EmptyState } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

/** Server-driven table: parent owns pagination/filter/sort state. */
export function DataTable<T>({
  data,
  columns,
  isLoading,
  page,
  pageSize,
  total,
  onPage,
}: Props<T>) {
  const t = useT();
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) return <LoadingState label={t('common.loading')} />;
  if (!data.length) return <EmptyState title={t('common.notFound')} />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-3 py-2 font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('admin.rows', { total, page, pages: totalPages })}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            {t('admin.prev')}
          </button>
          <button
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            {t('admin.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

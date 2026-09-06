import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import {
  LoadingState,
  EmptyState,
  IconChevronLeft,
  IconChevronRight,
} from '@prioritizz/ui';
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
export function DataTable<T>({ data, columns, isLoading, page, pageSize, total, onPage }: Props<T>) {
  const t = useT();
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) return <LoadingState label={t('common.loading')} />;
  if (!data.length) return <EmptyState title={t('common.notFound')} />;

  return (
    <div className="space-y-3">
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b hairline text-left text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 font-semibold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hairline transition-colors last:border-0 hover:bg-[hsl(var(--glass-bg))]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
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
            className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[hsl(var(--glass-bg-strong))] disabled:opacity-40"
            disabled={page <= 1}
            aria-label={t('admin.prev')}
            onClick={() => onPage(page - 1)}
          >
            <IconChevronLeft size={16} />
          </button>
          <button
            className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[hsl(var(--glass-bg-strong))] disabled:opacity-40"
            disabled={page >= totalPages}
            aria-label={t('admin.next')}
            onClick={() => onPage(page + 1)}
          >
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

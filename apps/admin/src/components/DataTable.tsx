import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import {
  LoadingState,
  EmptyState,
  IconButton,
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
    <div className="space-y-4">
      <div className="material overflow-x-auto rounded-2xl">
        <table className="w-full border-collapse text-subhead">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-separator text-left">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="whitespace-nowrap px-4 py-3 text-caption font-semibold uppercase tracking-wide text-subtle"
                  >
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
                className="border-b border-separator transition-colors last:border-0 hover:bg-grouped/60"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-footnote text-muted tabular-nums">
          {t('admin.rows', { total, page, pages: totalPages })}
        </span>
        <div className="flex gap-2">
          <IconButton
            label={t('admin.prev')}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="disabled:opacity-35"
          >
            <IconChevronLeft size={16} />
          </IconButton>
          <IconButton
            label={t('admin.next')}
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="disabled:opacity-35"
          >
            <IconChevronRight size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

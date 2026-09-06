import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { LoadingState, EmptyState } from '@prioritizz/ui';
/** Server-driven table: parent owns pagination/filter/sort state. */
export function DataTable({ data, columns, isLoading, page, pageSize, total, onPage }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (isLoading) return _jsx(LoadingState, {});
  if (!data.length) return _jsx(EmptyState, { title: 'No rows' });
  return _jsxs('div', {
    className: 'space-y-3',
    children: [
      _jsx('div', {
        className: 'overflow-x-auto rounded-lg border',
        children: _jsxs('table', {
          className: 'w-full text-sm',
          children: [
            _jsx('thead', {
              className: 'bg-muted/50 text-left',
              children: table
                .getHeaderGroups()
                .map((hg) =>
                  _jsx(
                    'tr',
                    {
                      children: hg.headers.map((h) =>
                        _jsx(
                          'th',
                          {
                            className: 'px-3 py-2 font-medium',
                            children: flexRender(h.column.columnDef.header, h.getContext()),
                          },
                          h.id,
                        ),
                      ),
                    },
                    hg.id,
                  ),
                ),
            }),
            _jsx('tbody', {
              children: table
                .getRowModel()
                .rows.map((row) =>
                  _jsx(
                    'tr',
                    {
                      className: 'border-t',
                      children: row
                        .getVisibleCells()
                        .map((cell) =>
                          _jsx(
                            'td',
                            {
                              className: 'px-3 py-2',
                              children: flexRender(cell.column.columnDef.cell, cell.getContext()),
                            },
                            cell.id,
                          ),
                        ),
                    },
                    row.id,
                  ),
                ),
            }),
          ],
        }),
      }),
      _jsxs('div', {
        className: 'flex items-center justify-between text-sm',
        children: [
          _jsxs('span', {
            className: 'text-muted-foreground',
            children: [total, ' rows \u00B7 page ', page, '/', totalPages],
          }),
          _jsxs('div', {
            className: 'flex gap-2',
            children: [
              _jsx('button', {
                className: 'rounded border px-2 py-1 disabled:opacity-50',
                disabled: page <= 1,
                onClick: () => onPage(page - 1),
                children: 'Prev',
              }),
              _jsx('button', {
                className: 'rounded border px-2 py-1 disabled:opacity-50',
                disabled: page >= totalPages,
                onClick: () => onPage(page + 1),
                children: 'Next',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=DataTable.js.map

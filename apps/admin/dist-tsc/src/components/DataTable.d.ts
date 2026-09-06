import { type ColumnDef } from '@tanstack/react-table';
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
export declare function DataTable<T>({
  data,
  columns,
  isLoading,
  page,
  pageSize,
  total,
  onPage,
}: Props<T>): import('react').JSX.Element;
export {};
//# sourceMappingURL=DataTable.d.ts.map

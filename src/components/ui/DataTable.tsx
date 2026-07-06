import type { ReactNode } from "react";

interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: ReactNode;
}

/** Server Component — generic table shell shared by any feature table with no interactive state (search/filter tables stay bespoke, like PriceScheduleHistoryTable). */
export function DataTable<T>({ columns, data, rowKey, emptyMessage = "No records found." }: DataTableProps<T>) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              {columns.map((col) => (
                <th key={col.id} className="px-3 py-2 font-semibold first:pl-0">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-b-0">
                {columns.map((col) => (
                  <td key={col.id} className="px-3 py-2 text-ink first:pl-0">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

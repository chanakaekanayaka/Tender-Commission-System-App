"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

interface JobOrderHistoryTableProps {
  data: JobOrderHistoryRecord[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

/** Job Order — History. Identical for Admin and Staff. Search is matched server-side against
 *  jobOrderNo/procurementNo (raw fields) — not the formatted currency/translated status text
 *  a client-side filter could previously match, which real backend search can't cheaply do. */
export function JobOrderHistoryTable({ data, search, page, totalPages, total }: JobOrderHistoryTableProps) {
  const { t } = useTranslation();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("jobOrderHistory.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          {
            id: "jobOrderNo",
            header: t("activeJobOrders.jobOrderNo"),
            cell: (row) => (
              <div>
                <span>{row.jobOrderNo}</span>
                {row.isAdminAssigned && (
                  <span className="mt-1 block w-fit rounded-none border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                    {t("activeJobOrders.adminAssignment")}
                  </span>
                )}
              </div>
            ),
          },
          { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
          {
            id: "completionDate",
            header: t("jobOrderHistory.completionDate"),
            cell: (row) => row.completionDate,
          },
          {
            id: "originalTotal",
            header: t("jobOrderHistory.originalTotal"),
            cell: (row) => formatLKR(row.originalTotal),
          },
          {
            id: "finalValue",
            header: t("jobOrderHistory.finalValue"),
            cell: (row) => formatLKR(row.finalValue),
          },
          {
            id: "profit",
            header: t("jobOrderHistory.profit"),
            cell: (row) => (
              <span className={row.profit < 0 ? "text-red-600" : "text-ink"}>{formatLKR(row.profit)}</span>
            ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              row.isDeleted ? (
                <StatusBadge label={t("status.deleted")} tone="red" />
              ) : (
                <StatusBadge label={t("status.completed")} tone="green" />
              ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("jobOrderHistory.noResults", { query: searchValue })}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />
    </div>
  );
}

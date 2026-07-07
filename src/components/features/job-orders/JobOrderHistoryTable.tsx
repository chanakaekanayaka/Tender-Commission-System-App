"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

interface JobOrderHistoryTableProps {
  data: JobOrderHistoryRecord[];
}

/** Job Order — History. Identical for Admin and Staff; only the search box needs client state, so that's the only reason this whole shell is 'use client'. */
export function JobOrderHistoryTable({ data }: JobOrderHistoryTableProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // Searches every visible column — including formatted currency strings —
    // so the query matches whatever the user actually sees in the table.
    const haystack = [
      row.jobOrderNo,
      row.procurementNo,
      row.completionDate,
      formatLKR(row.originalTotal),
      formatLKR(row.finalValue),
      formatLKR(row.profit),
      t("status.completed"),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("jobOrderHistory.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
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
            cell: () => <StatusBadge label={t("status.completed")} tone="green" />,
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("jobOrderHistory.noResults", { query })}
      />
    </div>
  );
}

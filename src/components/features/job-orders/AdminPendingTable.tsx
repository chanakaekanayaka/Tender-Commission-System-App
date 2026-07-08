"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { AdminPendingJobOrder } from "@/shared/types/job-order.types";

interface AdminPendingTableProps {
  initialData: AdminPendingJobOrder[];
}

/**
 * Admin's Pending Job Orders — every row here is, by construction, awaiting
 * payment from the procuring entity (the bill was already generated back on
 * the Active table). "Verify Payment" is the one next action.
 */
export function AdminPendingTable({ initialData }: AdminPendingTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const haystack = [row.jobOrderNo, row.procurementNo, formatLKR(row.billAmount), row.billGeneratedDate]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  // Mock-only: once payment is verified, the row leaves this list. A real
  // backend would move it into Job Order History on the server side.
  const handleVerifyPayment = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("jobOrderPending.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
          {
            id: "billAmount",
            header: t("jobOrderPending.billAmount"),
            cell: (row) => formatLKR(row.billAmount),
          },
          {
            id: "billGeneratedDate",
            header: t("jobOrderPending.billGeneratedDate"),
            cell: (row) => row.billGeneratedDate,
          },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("jobOrderPending.paymentPending")} tone="amber" />,
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <button
                type="button"
                onClick={() => handleVerifyPayment(row.id)}
                className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
              >
                {t("jobOrderPending.verifyPayment")}
              </button>
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={query ? t("jobOrderPending.noResults", { query }) : t("jobOrderPending.empty")}
      />
    </div>
  );
}

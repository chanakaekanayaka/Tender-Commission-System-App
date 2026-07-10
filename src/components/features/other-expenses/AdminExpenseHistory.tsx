"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { AdminExpenseRecord } from "@/shared/types/other-expense.types";

interface AdminExpenseHistoryProps {
  data: AdminExpenseRecord[];
}

/**
 * Admin's Other Expenses history — every job-order-linked expense, searchable
 * by job order no or category. Client-only because of the search box state,
 * same split as JobOrderHistoryTable. Receipt "View" is a stub label until
 * real file storage exists (no backend for uploaded receipts yet).
 */
export function AdminExpenseHistory({ data }: AdminExpenseHistoryProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.jobOrderNo, row.category].join(" ").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("otherExpenses.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "date", header: t("otherExpenses.date"), cell: (row) => row.date },
          { id: "jobOrderNo", header: t("otherExpenses.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "category", header: t("otherExpenses.category"), cell: (row) => row.category },
          { id: "description", header: t("otherExpenses.description"), cell: (row) => row.description },
          { id: "amount", header: t("otherExpenses.amount"), cell: (row) => formatLKR(row.amount) },
          {
            id: "receipt",
            header: t("otherExpenses.receipt"),
            cell: (row) =>
              row.receiptFileName ? (
                <button type="button" className="text-xs font-medium text-ink underline">
                  {t("common.view")}
                </button>
              ) : (
                <span className="text-xs text-muted">{t("otherExpenses.noReceipt")}</span>
              ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) => (
              <StatusBadge
                label={row.status === "Approved" ? t("otherExpenses.approved") : t("otherExpenses.pending")}
                tone={row.status === "Approved" ? "green" : "amber"}
              />
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noResults")}
      />
    </div>
  );
}

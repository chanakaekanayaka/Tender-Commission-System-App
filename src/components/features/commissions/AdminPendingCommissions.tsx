"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { AdminPendingCommission } from "@/shared/types/commission.types";

interface AdminPendingCommissionsProps {
  data: AdminPendingCommission[];
  onApprove?: (row: AdminPendingCommission) => void;
  onReject?: (row: AdminPendingCommission) => void;
}

/**
 * Admin's Pending Commissions — one row per staff commission awaiting a payout
 * decision. Approve/Reject just remove the row locally (dummy data, no backend
 * yet); the optional callbacks let a future data layer hook in without changing
 * this component. Client-only because of the Approve/Reject + search state,
 * same split as JobOrderHistoryTable.
 */
export function AdminPendingCommissions({ data, onApprove, onReject }: AdminPendingCommissionsProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");

  const handleApprove = (row: AdminPendingCommission) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    onApprove?.(row);
  };

  const handleReject = (row: AdminPendingCommission) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    onReject?.(row);
  };

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.staffName, row.jobOrderNo].join(" ").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("commissions.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "staffName", header: t("commissions.staffName"), cell: (row) => row.staffName },
          { id: "jobOrderNo", header: t("commissions.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "profit", header: t("commissions.profit"), cell: (row) => formatLKR(row.profit) },
          {
            id: "commissionRate",
            header: t("commissions.commissionRate"),
            cell: (row) => `${row.commissionRate}%`,
          },
          {
            id: "calculatedCommission",
            header: t("commissions.calculatedCommission"),
            cell: (row) => formatLKR((row.profit * row.commissionRate) / 100),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("commissions.pendingStatus")} tone="amber" />,
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleApprove(row)}
                  className="text-xs font-medium text-ink underline"
                >
                  {t("commissions.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(row)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  {t("commissions.reject")}
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("commissions.noPending")}
      />
    </div>
  );
}

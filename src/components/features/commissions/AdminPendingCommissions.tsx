"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { AdminPendingCommission } from "@/shared/types/commission.types";

interface AdminPendingCommissionsProps {
  data: AdminPendingCommission[];
}

/**
 * Admin's Pending Commissions — one row per Job Order whose commission is awaiting a payout
 * decision. Approve pays Staff their commission (PATCH pay-commission) and Reject declines it
 * (PATCH reject-commission) — both real, independent of whether the procuring entity has paid the
 * company yet. Client-only because of the Approve/Reject + search state, same split as
 * JobOrderHistoryTable.
 */
export function AdminPendingCommissions({ data }: AdminPendingCommissionsProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleApprove = async (row: AdminPendingCommission) => {
    setProcessingId(row.id);
    try {
      const res = await fetch(`/api/job-orders/${row.id}/pay-commission`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to pay commission.");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to pay commission.", variant: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (row: AdminPendingCommission) => {
    setProcessingId(row.id);
    try {
      const res = await fetch(`/api/job-orders/${row.id}/reject-commission`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to reject commission.");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to reject commission.", variant: "error" });
    } finally {
      setProcessingId(null);
    }
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
            cell: (row) => formatLKR(row.calculatedCommission),
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
                  disabled={processingId === row.id}
                  className="text-xs font-medium text-green-700 underline hover:text-green-800 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                  {t("commissions.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(row)}
                  disabled={processingId === row.id}
                  className="text-xs font-medium text-red-600 underline hover:text-red-700 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
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

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

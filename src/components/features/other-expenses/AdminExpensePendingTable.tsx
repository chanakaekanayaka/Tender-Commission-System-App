"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { AdminExpensePendingRecord } from "@/shared/types/other-expense.types";

interface AdminExpensePendingTableProps {
  data: AdminExpensePendingRecord[];
}

/** Admin's Pending Expenses — every Staff-submitted expense awaiting Approve/Reject. Approving or
 *  rejecting moves the row out of this list for good — the query behind this page filters on
 *  status: "Pending". */
export function AdminExpensePendingTable({ data }: AdminExpensePendingTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.staffName, row.description].join(" ").toLowerCase().includes(q);
  });
  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  const handleApprove = async (row: AdminExpensePendingRecord) => {
    setProcessingId(row.id);
    try {
      const res = await fetch(`/api/other-expenses/${row.id}/approve`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to approve expense.");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to approve expense.", variant: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (row: AdminExpensePendingRecord) => {
    setProcessingId(row.id);
    try {
      const res = await fetch(`/api/other-expenses/${row.id}/reject`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to reject expense.");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to reject expense.", variant: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("otherExpenses.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "staffName", header: t("otherExpenses.staffName"), cell: (row) => row.staffName },
          { id: "description", header: t("otherExpenses.description"), cell: (row) => row.description },
          { id: "date", header: t("otherExpenses.date"), cell: (row) => row.date },
          { id: "amount", header: t("otherExpenses.amount"), cell: (row) => formatLKR(row.amount) },
          {
            id: "receipt",
            header: t("otherExpenses.receipt"),
            cell: (row) => (
              <JobOrderDocumentCell documentName={row.receiptFileName} onPreview={() => setPreviewId(row.id)} />
            ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("otherExpenses.pending")} tone="amber" />,
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
                  {t("otherExpenses.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(row)}
                  disabled={processingId === row.id}
                  className="text-xs font-medium text-red-600 underline hover:text-red-700 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                  {t("otherExpenses.reject")}
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noPending")}
      />

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.receiptFileName}
        fileType={previewRow?.receiptFileType}
        url={previewRow?.receiptUrl}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

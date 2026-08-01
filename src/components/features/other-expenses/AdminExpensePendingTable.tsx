"use client";

import { useRef, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { AdminExpensePendingRecord } from "@/shared/types/other-expense.types";

interface AdminExpensePendingTableProps {
  data: AdminExpensePendingRecord[];
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/**
 * Admin's Pending Expenses — one row per Staff-submitted expense not yet confirmed by Staff,
 * covering two stages. Unpaid: Upload approves the expense (PATCH approve), which requires a
 * payment receipt as evidence; Reject declines it outright (PATCH reject). Already paid
 * (`awaitingStaffConfirmation`): Upload/Reject are replaced with a read-only indicator, since
 * there's nothing left for Admin to do until Staff reviews the receipt and confirms it on their own
 * side — that confirmation, not the upload itself, is what actually moves the row to History.
 */
export function AdminExpensePendingTable({ data }: AdminExpensePendingTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvingRowId, setApprovingRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.staffName, row.description].join(" ").toLowerCase().includes(q);
  });
  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  // Upload is a two-step click: this just opens the file picker for the row in question; the
  // actual PATCH only fires once a receipt is actually chosen (see handleFileChange).
  const startApprove = (row: AdminExpensePendingRecord) => {
    setApprovingRowId(row.id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (file: File | undefined) => {
    const rowId = approvingRowId;
    if (!file || !rowId) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setToast({ message: t("otherExpenses.invalidFileType"), variant: "error" });
      return;
    }

    setProcessingId(rowId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/other-expenses/${rowId}/approve`, { method: "PATCH", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to approve expense.");
      }
      // Stays in Pending — it only actually leaves once Staff confirms (see confirm-payment) — so
      // this updates the row in place (uploaded, awaiting Staff) instead of removing it.
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, awaitingStaffConfirmation: true, paymentUploadedAt: formatDateTime(new Date(result.data.paymentProof.uploadedAt)) }
            : r,
        ),
      );
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to approve expense.", variant: "error" });
    } finally {
      setProcessingId(null);
      setApprovingRowId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          { id: "paymentUploadedAt", header: t("otherExpenses.uploadTime"), cell: (row) => row.paymentUploadedAt ?? "—" },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              row.awaitingStaffConfirmation ? (
                <StatusBadge label={t("otherExpenses.awaitingStaffVerification")} tone="blue" />
              ) : (
                <StatusBadge label={t("otherExpenses.pending")} tone="amber" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.awaitingStaffConfirmation ? (
                <span className="text-xs text-muted">{t("otherExpenses.awaitingStaffVerification")}</span>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startApprove(row)}
                    disabled={processingId === row.id}
                    className="text-xs font-medium text-green-700 underline hover:text-green-800 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                  >
                    {processingId === row.id ? t("otherExpenses.uploading") : t("otherExpenses.upload")}
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

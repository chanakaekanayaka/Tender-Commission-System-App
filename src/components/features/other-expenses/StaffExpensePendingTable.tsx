"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

interface StaffExpensePendingTableProps {
  data: StaffExpensePendingRecord[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Staff's own submitted expenses not yet confirmed, covering two stages. Awaiting Admin's
 * decision: read-only, nothing to do yet. Already approved (Admin uploaded a payment receipt):
 * Staff's one action is reviewing that receipt and confirming (PATCH confirm-payment), which is
 * what actually moves the row into History for both roles.
 */
export function StaffExpensePendingTable({ data, search, page, totalPages, total }: StaffExpensePendingTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [paymentPreviewId, setPaymentPreviewId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const previewRow = data.find((row) => row.id === previewId) ?? null;
  const paymentPreviewRow = data.find((row) => row.id === paymentPreviewId) ?? null;

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/other-expenses/${id}/confirm-payment`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to confirm payment.");
      }
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to confirm payment.", variant: "error" });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("otherExpenses.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
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
            id: "paymentReceipt",
            header: t("otherExpenses.paymentReceipt"),
            cell: (row) =>
              row.paymentProofFileName ? (
                <JobOrderDocumentCell
                  documentName={row.paymentProofFileName}
                  onPreview={() => setPaymentPreviewId(row.id)}
                />
              ) : (
                <span className="text-xs text-muted">{t("otherExpenses.paymentReceiptNotUploaded")}</span>
              ),
          },
          { id: "paymentUploadedAt", header: t("otherExpenses.uploadTime"), cell: (row) => row.paymentUploadedAt ?? "—" },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              row.paymentProofFileName ? (
                <StatusBadge label={t("otherExpenses.awaitingConfirmation")} tone="amber" />
              ) : (
                <StatusBadge label={t("otherExpenses.awaitingPayment")} tone="blue" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.paymentProofFileName ? (
                <button
                  type="button"
                  onClick={() => handleConfirm(row.id)}
                  disabled={confirmingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-none bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {confirmingId === row.id ? t("otherExpenses.confirming") : t("otherExpenses.confirm")}
                </button>
              ) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noPending")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.receiptFileName}
        fileType={previewRow?.receiptFileType}
        url={previewRow?.receiptUrl}
      />

      <DocumentPreviewModal
        open={paymentPreviewRow !== null}
        onClose={() => setPaymentPreviewId(null)}
        fileName={paymentPreviewRow?.paymentProofFileName}
        fileType={paymentPreviewRow?.paymentProofFileType}
        url={paymentPreviewRow?.paymentProofUrl}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

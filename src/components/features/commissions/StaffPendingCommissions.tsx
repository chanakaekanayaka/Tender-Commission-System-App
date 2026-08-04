"use client";

import { Eye, FileText, Loader2 } from "lucide-react";
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
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { StaffPendingCommission } from "@/shared/types/commission.types";

interface StaffPendingCommissionsProps {
  data: StaffPendingCommission[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Staff's Pending Commissions — mirrors Admin's own two stages so Staff can see the full lifecycle,
 * not just the final step. Awaiting Admin's payment: read-only, nothing to do yet. Already paid:
 * Staff's one action is reviewing the uploaded receipt and confirming (PATCH
 * confirm-commission-payment), which is what actually moves the row into Commissions History for
 * both roles.
 */
export function StaffPendingCommissions({ data, search, page, totalPages, total }: StaffPendingCommissionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const previewRow = data.find((row) => row.id === previewId) ?? null;

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/confirm-commission-payment`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to confirm commission payment.");
      }
      router.refresh();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to confirm commission payment.",
        variant: "error",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("commissions.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
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
          { id: "uploadedAt", header: t("commissions.uploadTime"), cell: (row) => row.uploadedAt ?? "—" },
          {
            id: "receipt",
            header: t("commissions.receipt"),
            cell: (row) =>
              row.paymentProofName ? (
                <button
                  type="button"
                  onClick={() => setPreviewId(row.id)}
                  className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  <span className="max-w-[8rem] truncate">{row.paymentProofName}</span>
                  <Eye className="h-3.5 w-3.5 text-muted" aria-hidden />
                </button>
              ) : (
                <span className="text-xs text-muted">{t("commissions.receiptNotUploaded")}</span>
              ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              row.paymentProofName ? (
                <StatusBadge label={t("commissions.awaitingConfirmation")} tone="amber" />
              ) : (
                <StatusBadge label={t("commissions.awaitingPayment")} tone="blue" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.paymentProofName ? (
                <button
                  type="button"
                  onClick={() => handleConfirm(row.id)}
                  disabled={confirmingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-none bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {confirmingId === row.id ? t("commissions.confirming") : t("commissions.confirm")}
                </button>
              ) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("commissions.noPending")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.paymentProofName ?? undefined}
        fileType={previewRow?.paymentProofType ?? undefined}
        url={previewRow?.paymentProofUrl ?? undefined}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

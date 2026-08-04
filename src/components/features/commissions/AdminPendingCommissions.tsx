"use client";

import { useRef, useState } from "react";
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
import type { AdminPendingCommission } from "@/shared/types/commission.types";

interface AdminPendingCommissionsProps {
  data: AdminPendingCommission[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/**
 * Admin's Pending Commissions — one row per Job Order whose commission hasn't been confirmed yet,
 * covering two stages. Unpaid: Upload pays Staff their commission (PATCH pay-commission), which
 * requires a payment receipt as evidence; Reject declines it outright (PATCH reject-commission) —
 * both independent of whether the procuring entity has paid the company yet. Already paid
 * (`awaitingStaffConfirmation`): Upload/Reject are replaced with a read-only indicator, since
 * there's nothing left for Admin to do until Staff reviews the receipt and confirms it on their own
 * side — that confirmation, not the upload itself, is what actually moves the row to History.
 * Client-only because of the Upload/Reject + search state, same split as JobOrderHistoryTable.
 */
export function AdminPendingCommissions({ data, search, page, totalPages, total }: AdminPendingCommissionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvingRowId, setApprovingRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Approve is a two-step click: this just opens the file picker for the row in question; the
  // actual PATCH only fires once a receipt is actually chosen (see handleFileChange).
  const startApprove = (row: AdminPendingCommission) => {
    setApprovingRowId(row.id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (file: File | undefined) => {
    const rowId = approvingRowId;
    if (!file || !rowId) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setToast({ message: t("commissions.receiptInvalidType"), variant: "error" });
      return;
    }

    setProcessingId(rowId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/job-orders/${rowId}/pay-commission`, { method: "PATCH", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to pay commission.");
      }
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to pay commission.", variant: "error" });
    } finally {
      setProcessingId(null);
      setApprovingRowId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to reject commission.", variant: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("commissions.searchPlaceholder")} />
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
            cell: (row) =>
              row.awaitingStaffConfirmation ? (
                <StatusBadge label={t("commissions.awaitingStaffVerification")} tone="blue" />
              ) : (
                <StatusBadge label={t("commissions.pendingStatus")} tone="amber" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.awaitingStaffConfirmation ? (
                <span className="text-xs text-muted">{t("commissions.awaitingStaffVerification")}</span>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startApprove(row)}
                    disabled={processingId === row.id}
                    className="text-xs font-medium text-green-700 underline hover:text-green-800 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                  >
                    {processingId === row.id ? t("commissions.uploading") : t("commissions.upload")}
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
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("commissions.noPending")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

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

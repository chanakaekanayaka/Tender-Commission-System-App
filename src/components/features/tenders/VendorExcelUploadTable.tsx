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
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { VendorExcelDetailModal } from "@/components/features/tenders/VendorExcelDetailModal";
import type { VendorExcelUploadSummary } from "@/shared/types/vendorExcelUpload.types";

interface VendorExcelUploadTableProps {
  data: VendorExcelUploadSummary[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

export function VendorExcelUploadTable({ data, search, page, totalPages, total }: VendorExcelUploadTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [viewId, setViewId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("vendorExcelUploads.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vendor-excel-uploads/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete.");
      }
      setToast({ message: t("vendorExcelUploads.deleteSuccess"), variant: "success" });
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to delete.", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/vendor-excel-uploads/${id}/confirm`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to confirm.");
      }
      setToast({ message: t("vendorExcelUploads.confirmSuccess"), variant: "success" });
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to confirm.", variant: "error" });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput
          value={searchValue}
          onChange={setSearch}
          placeholder={t("vendorExcelUploads.searchPlaceholder")}
        />
      </div>

      <DataTable
        columns={[
          { id: "fileName", header: t("vendorExcelUploads.fileName"), cell: (row) => row.fileName },
          { id: "vendorCount", header: t("vendorExcelUploads.vendorCount"), cell: (row) => row.vendorCount },
          { id: "uploadedAt", header: t("priceScheduleHistory.uploadedDate"), cell: (row) => row.uploadedAt },
          {
            id: "confirmed",
            header: t("vendorExcelUploads.confirmColumn"),
            cell: (row) =>
              row.confirmed ? (
                <StatusBadge label={t("vendorExcelUploads.confirmed")} tone="green" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirm(row.id)}
                  disabled={confirmingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-none bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {confirmingId === row.id ? t("vendorExcelUploads.confirming") : t("vendorExcelUploads.confirm")}
                </button>
              ),
          },
          {
            id: "actions",
            header: "",
            cell: (row) => (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewId(row.id)}
                  className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:bg-active/90"
                >
                  {t("vendorExcelUploads.viewAction")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  disabled={deletingId === row.id}
                  className="text-xs font-medium text-red-600 underline decoration-red-200 underline-offset-2 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("vendorExcelUploads.deleteAction")}
                </button>
              </div>
            ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={searchValue ? t("vendorExcelUploads.noResults", { query: searchValue }) : t("vendorExcelUploads.empty")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

      {viewId && <VendorExcelDetailModal id={viewId} onClose={() => setViewId(null)} />}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

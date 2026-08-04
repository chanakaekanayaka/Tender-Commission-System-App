"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import { PaymentProofUploadCell } from "@/components/features/job-orders/PaymentProofUploadCell";
import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

interface StaffPendingJobOrdersProps {
  data: StaffPendingJobOrder[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
  /** Sum of every matching row's amount, not just this page — see the page's own comment. */
  totalPendingAmount: number;
}

/**
 * Staff's monitoring view of bills Admin is still chasing payment for. The one action here is
 * uploading payment proof (bank slip, cheque copy, etc.) once the entity actually pays, so Admin
 * has real evidence before clicking Verify Payment. Every row here has a real generated bill that
 * hasn't been payment-verified yet; once Admin verifies it, the row simply stops appearing here.
 */
export function StaffPendingJobOrders({
  data,
  search,
  page,
  totalPages,
  total,
  totalPendingAmount,
}: StaffPendingJobOrdersProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const previewRow = data.find((row) => row.id === previewId) ?? null;

  return (
    <div className="space-y-4">
      <StatCard label={t("staffPendingJobOrders.totalPending")} value={formatLKR(totalPendingAmount)} />

      <div className="rounded-none border border-border bg-card p-4">
        <div className="mb-4">
          <SearchInput
            value={searchValue}
            onChange={setSearch}
            placeholder={t("staffPendingJobOrders.searchPlaceholder")}
          />
        </div>

        <DataTable
          columns={[
            {
              id: "jobOrderNo",
              header: t("activeJobOrders.jobOrderNo"),
              cell: (row) => (
                <div>
                  <span>{row.jobOrderNo}</span>
                  {row.isAdminAssigned && (
                    <span className="mt-1 block w-fit rounded-none border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                      {t("activeJobOrders.adminAssignment")}
                    </span>
                  )}
                </div>
              ),
            },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            {
              id: "status",
              header: t("common.status"),
              cell: (row) =>
                row.paymentProofVerified ? (
                  <StatusBadge label={t("staffPendingJobOrders.verified")} tone="green" />
                ) : row.paymentProofName ? (
                  <StatusBadge label={t("staffPendingJobOrders.verificationPending")} tone="amber" />
                ) : (
                  <StatusBadge label={t("staffPendingJobOrders.billUploadPending")} tone="blue" />
                ),
            },
            { id: "amount", header: t("staffPendingJobOrders.amount"), cell: (row) => formatLKR(row.amount) },
            {
              id: "dateSubmitted",
              header: t("staffPendingJobOrders.dateSubmitted"),
              cell: (row) => row.dateSubmitted,
            },
            {
              id: "paymentProof",
              header: t("staffPendingJobOrders.paymentProof"),
              cell: (row) => (
                <PaymentProofUploadCell
                  jobOrderId={row.id}
                  fileName={row.paymentProofName}
                  onPreview={() => setPreviewId(row.id)}
                  onUploaded={() => {
                    setToast({ message: t("staffPendingJobOrders.proofUploaded"), variant: "success" });
                    router.refresh();
                  }}
                  onError={(message) => setToast({ message, variant: "error" })}
                />
              ),
            },
          ]}
          data={data}
          rowKey={(row) => row.id}
          emptyMessage={
            searchValue
              ? t("staffPendingJobOrders.noResults", { query: searchValue })
              : t("staffPendingJobOrders.empty")
          }
        />

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />
      </div>

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.paymentProofName}
        fileType={previewRow?.paymentProofType}
        url={previewRow?.paymentProofUrl}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

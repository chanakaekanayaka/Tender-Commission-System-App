"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import { PaymentProofUploadCell } from "@/components/features/job-orders/PaymentProofUploadCell";
import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

interface StaffPendingJobOrdersProps {
  initialData: StaffPendingJobOrder[];
}

/**
 * Staff's monitoring view of bills Admin is still chasing payment for. The one action here is
 * uploading payment proof (bank slip, cheque copy, etc.) once the entity actually pays, so Admin
 * has real evidence before clicking Verify Payment. Every row here has a real generated bill that
 * hasn't been payment-verified yet; once Admin verifies it, the row simply stops appearing here.
 */
export function StaffPendingJobOrders({ initialData }: StaffPendingJobOrdersProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const totalPending = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const filtered = rows.filter((row) => row.jobOrderNo.toLowerCase().includes(query.trim().toLowerCase()));

  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  return (
    <div className="space-y-4">
      <StatCard label={t("staffPendingJobOrders.totalPending")} value={formatLKR(totalPending)} />

      <div className="rounded-none border border-border bg-card p-4">
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
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
                  onUploaded={({ fileName, fileType, previewUrl }) => {
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id
                          ? { ...r, paymentProofName: fileName, paymentProofType: fileType, paymentProofUrl: previewUrl }
                          : r,
                      ),
                    );
                    setToast({ message: t("staffPendingJobOrders.proofUploaded"), variant: "success" });
                  }}
                  onError={(message) => setToast({ message, variant: "error" })}
                />
              ),
            },
          ]}
          data={filtered}
          rowKey={(row) => row.id}
          emptyMessage={
            query ? t("staffPendingJobOrders.noResults", { query }) : t("staffPendingJobOrders.empty")
          }
        />
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

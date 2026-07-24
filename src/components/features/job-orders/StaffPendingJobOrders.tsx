"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { formatDateISO } from "@/lib/utils/dueDate";
import { formatLKR } from "@/lib/utils/currency";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { openPendingPaymentSummary } from "@/lib/utils/printPendingSummary";
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

  const handlePrintSummary = (row: StaffPendingJobOrder) => {
    openPendingPaymentSummary({
      companyName: defaultSystemConfig.companyName,
      title: t("staffPendingJobOrders.printSummaryTitle"),
      printedAtLabel: `${t("staffPendingJobOrders.printedAt")}: ${formatDateISO(new Date())}`,
      rows: [
        { label: t("activeJobOrders.jobOrderNo"), value: row.jobOrderNo },
        { label: t("common.procurementNo"), value: row.procurementNo },
        { label: t("staffPendingJobOrders.amount"), value: formatLKR(row.amount) },
        { label: t("staffPendingJobOrders.dateSubmitted"), value: row.dateSubmitted },
      ],
    });
  };

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
            { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            {
              id: "status",
              header: t("common.status"),
              cell: () => <StatusBadge label={t("staffPendingJobOrders.paymentPending")} tone="amber" />,
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
            {
              id: "actions",
              header: t("common.actions"),
              cell: (row) => (
                <button
                  type="button"
                  onClick={() => handlePrintSummary(row)}
                  className="rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
                >
                  {t("staffPendingJobOrders.printSummary")}
                </button>
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

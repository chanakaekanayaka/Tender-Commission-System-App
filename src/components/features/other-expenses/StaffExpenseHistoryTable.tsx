"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { StaffExpenseHistoryRecord } from "@/shared/types/other-expense.types";

interface StaffExpenseHistoryTableProps {
  data: StaffExpenseHistoryRecord[];
}

/** Staff's own already-reviewed expenses (Approved or Rejected). Approved rows also carry the
 *  payment receipt Admin uploaded and Staff confirmed, so it stays reviewable after the fact. */
export function StaffExpenseHistoryTable({ data }: StaffExpenseHistoryTableProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [paymentPreviewId, setPaymentPreviewId] = useState<string | null>(null);

  const filtered = data.filter((row) => row.description.toLowerCase().includes(query.trim().toLowerCase()));
  const previewRow = data.find((row) => row.id === previewId) ?? null;
  const paymentPreviewRow = data.find((row) => row.id === paymentPreviewId) ?? null;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("otherExpenses.searchPlaceholder")} />
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
                <span className="text-xs text-muted">—</span>
              ),
          },
          { id: "paymentUploadedAt", header: t("otherExpenses.uploadTime"), cell: (row) => row.paymentUploadedAt ?? "—" },
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo ?? "—" },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) => (
              <StatusBadge
                label={row.status === "Approved" ? t("otherExpenses.approved") : t("otherExpenses.rejected")}
                tone={row.status === "Approved" ? "green" : "red"}
              />
            ),
          },
          { id: "reviewedDate", header: t("otherExpenses.reviewedDate"), cell: (row) => row.reviewedDate },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noResults")}
      />

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
    </div>
  );
}

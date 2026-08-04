"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { AdminExpenseHistoryRecord } from "@/shared/types/other-expense.types";

interface AdminExpenseHistoryProps {
  data: AdminExpenseHistoryRecord[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

/** Admin's Other Expenses history — every Staff-submitted expense already reviewed (Approved or
 *  Rejected), searchable by staff name or description. Approved rows also carry the payment
 *  receipt Admin uploaded and Staff confirmed, so it stays reviewable after the fact. */
export function AdminExpenseHistory({ data, search, page, totalPages, total }: AdminExpenseHistoryProps) {
  const { t } = useTranslation();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [paymentPreviewId, setPaymentPreviewId] = useState<string | null>(null);

  const previewRow = data.find((row) => row.id === previewId) ?? null;
  const paymentPreviewRow = data.find((row) => row.id === paymentPreviewId) ?? null;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("otherExpenses.searchPlaceholder")} />
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
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("otherExpenses.noResults")}
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
    </div>
  );
}

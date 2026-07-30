"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { InvoiceRequest } from "@/shared/types/invoice.types";

interface StaffInvoiceHistoryTableProps {
  data: InvoiceRequest[];
}

/** Staff's own invoices (both Pending Review and already-Paid), real data — Admin's Upload action
 *  on the (admin) side shows up here immediately since both read the same Invoice records. */
export function StaffInvoiceHistoryTable({ data }: StaffInvoiceHistoryTableProps) {
  const { t } = useTranslation();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingInvoice = data.find((invoice) => invoice.id === viewingId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <DataTable
        columns={[
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo },
          { id: "submittedDate", header: t("invoices.submittedDate"), cell: (row) => row.submittedDate },
          { id: "total", header: t("invoices.total"), cell: (row) => formatLKR(row.total) },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) => (
              <StatusBadge
                label={row.status === "Paid" ? t("invoices.paid") : t("invoices.pendingReview")}
                tone={row.status === "Paid" ? "green" : "amber"}
              />
            ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <button
                type="button"
                onClick={() => setViewingId(row.id)}
                className="text-xs font-medium text-ink underline"
              >
                {t("common.view")}
              </button>
            ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("invoices.noHistory")}
      />

      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingId(null)} />
    </div>
  );
}

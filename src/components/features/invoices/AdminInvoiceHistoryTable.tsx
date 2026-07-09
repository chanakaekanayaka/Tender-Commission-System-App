"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useInvoiceStore } from "@/context/InvoiceStoreContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

/** All Paid invoices across every Staff member — reads the same shared InvoiceStore Admin's Upload action writes to. */
export function AdminInvoiceHistoryTable() {
  const { t } = useTranslation();
  const { invoices } = useInvoiceStore();
  const [viewingId, setViewingId] = useState<string | null>(null);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const viewingInvoice = paidInvoices.find((invoice) => invoice.id === viewingId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <DataTable
        columns={[
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo },
          { id: "submittedBy", header: t("invoices.submittedBy"), cell: (row) => row.submittedBy },
          { id: "total", header: t("invoices.total"), cell: (row) => formatLKR(row.total) },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("invoices.paid")} tone="green" />,
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
        data={paidInvoices}
        rowKey={(row) => row.id}
        emptyMessage={t("invoices.noHistory")}
      />

      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingId(null)} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useInvoiceStore } from "@/context/InvoiceStoreContext";
import { useTranslation } from "@/context/LanguageContext";
import { staffOptions } from "@/lib/mock/jobOrders.mock";
import { formatLKR } from "@/lib/utils/currency";

// Same "current Staff user" stand-in used across the Staff portal (no auth/session yet).
const CURRENT_STAFF_NAME = staffOptions[0].name;

/** Staff's own invoice history, filtered from the shared InvoiceStore — Admin's Verify/Upload actions on the (admin) side show up here immediately since both portals read the same store. */
export function StaffInvoiceHistoryTable() {
  const { t } = useTranslation();
  const { invoices } = useInvoiceStore();
  const [viewingId, setViewingId] = useState<string | null>(null);

  const myInvoices = invoices.filter((invoice) => invoice.submittedBy === CURRENT_STAFF_NAME);
  const viewingInvoice = myInvoices.find((invoice) => invoice.id === viewingId) ?? null;

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
        data={myInvoices}
        rowKey={(row) => row.id}
        emptyMessage={t("invoices.noHistory")}
      />

      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingId(null)} />
    </div>
  );
}

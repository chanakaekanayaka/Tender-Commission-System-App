"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { InvoiceRequest } from "@/shared/types/invoice.types";

interface InvoiceDetailModalProps {
  invoice: InvoiceRequest | null;
  onClose: () => void;
}

/** Read-only line-item breakdown — reused by both Admin's Invoice Requests/History and Staff's History "View" action. */
export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const { t } = useTranslation();

  return (
    <Modal open={invoice !== null} onClose={onClose} title={t("invoices.detailModalTitle", { invoiceNo: invoice?.invoiceNo ?? "" })}>
      {invoice && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">{t("invoices.submittedBy")}</p>
              <p className="text-ink">{invoice.submittedBy}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{t("invoices.submittedDate")}</p>
              <p className="text-ink">{invoice.submittedDate}</p>
            </div>
          </div>

          <DataTable
            columns={[
              { id: "label", header: t("invoices.lineItemLabel"), cell: (row) => row.label },
              {
                id: "type",
                header: t("invoices.lineItemType"),
                cell: (row) => (row.type === "commission" ? t("invoices.typeCommission") : t("invoices.typeExpense")),
              },
              { id: "amount", header: t("invoices.lineItemAmount"), cell: (row) => formatLKR(row.amount) },
            ]}
            data={invoice.items}
            rowKey={(row) => row.id}
          />

          <p className="text-right text-sm font-semibold text-ink">
            {t("invoices.total")}: {formatLKR(invoice.total)}
          </p>

          {invoice.paymentBillFileName && (
            <p className="text-xs text-muted">
              {t("invoices.paymentBill")}: {invoice.paymentBillFileName}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

"use client";

import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { jobOrderDetailsByJobNumber } from "@/lib/mock/jobOrderDetails.mock";
import { formatAmount, formatLKR } from "@/lib/utils/currency";
import { calculateLineItemTotals } from "@/lib/utils/pricing";

interface JobOrderDetailModalProps {
  jobNumber: string | null;
  onClose: () => void;
}

/**
 * Staff Dashboard's "Pending Orders" job-number drill-down — read-only, full detail
 * view (metadata / line items / financial summary / document) for a single job order.
 * Looks up its own data by `jobNumber` so the trigger (PendingOrdersTable) only needs
 * to pass which row was clicked, not the whole record.
 */
export function JobOrderDetailModal({ jobNumber, onClose }: JobOrderDetailModalProps) {
  const { t } = useTranslation();
  const detail = jobNumber ? jobOrderDetailsByJobNumber[jobNumber] : null;

  const originalTotal = detail
    ? detail.lineItems.reduce(
        (sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice).subTotal,
        0,
      )
    : 0;

  return (
    <Modal
      open={jobNumber !== null}
      onClose={onClose}
      size="lg"
      title={
        detail ? (
          <span>
            {detail.jobOrderNo} <span className="text-muted">·</span> {detail.procurementNo}
          </span>
        ) : (
          jobNumber ?? ""
        )
      }
    >
      {!detail ? (
        <p className="text-sm text-muted">{t("jobOrderDetailModal.notFound")}</p>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("jobOrderDetailModal.metadataHeading")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t("jobOrderCreate.address")} value={detail.metadata.address} />
              <Field label={t("jobOrderCreate.telephone")} value={detail.metadata.telephone} />
              <Field label={t("jobOrderCreate.email")} value={detail.metadata.email} />
              <Field label={t("jobOrderCreate.note")} value={detail.metadata.note} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("jobOrderDetailModal.lineItemsHeading")}
            </h3>
            <DataTable
              columns={[
                { id: "item", header: t("lineItems.itemDescription"), cell: (row) => row.item },
                { id: "qty", header: t("lineItems.qty"), cell: (row) => row.qty },
                {
                  id: "unitPrice",
                  header: t("lineItems.unitPrice"),
                  cell: (row) => formatAmount(row.unitPrice),
                },
                {
                  id: "vat",
                  header: t("lineItems.vat"),
                  cell: (row) => formatAmount(calculateLineItemTotals(row.qty, row.unitPrice).vat),
                },
                {
                  id: "subTotal",
                  header: t("lineItems.subTotal"),
                  cell: (row) => formatAmount(calculateLineItemTotals(row.qty, row.unitPrice).subTotal),
                },
              ]}
              data={detail.lineItems}
              rowKey={(row) => row.id}
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("jobOrderDetailModal.summaryHeading")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryStat
                label={t("jobOrderCreate.originalTotal")}
                value={formatLKR(Math.round(originalTotal))}
              />
              <SummaryStat
                label={t("jobOrderCreate.salesCommission")}
                value={formatLKR(detail.commissionValue)}
              />
              <SummaryStat
                label={t("jobOrderDetailModal.otherExpenses")}
                value={formatLKR(detail.otherExpensesTotal)}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("jobOrderDetailModal.documentHeading")}
            </h3>
            {detail.documentName ? (
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1.5 text-sm text-ink underline decoration-border underline-offset-2 hover:text-active"
              >
                <FileText className="h-4 w-4 text-muted" aria-hidden />
                {detail.documentName}
              </a>
            ) : (
              <p className="text-sm text-muted">{t("activeJobOrders.notUploaded")}</p>
            )}
          </section>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="rounded-none border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

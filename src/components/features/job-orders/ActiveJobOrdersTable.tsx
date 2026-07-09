"use client";

import { Download, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useTranslation } from "@/context/LanguageContext";
import { jobOrderDetailsByJobNumber } from "@/lib/mock/jobOrderDetails.mock";
import { formatDateISO } from "@/lib/utils/dueDate";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { addGeneratedPendingJobOrder } from "@/lib/utils/staffPendingJobOrdersStore";
import type { ActiveJobOrder } from "@/shared/types/job-order.types";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";

interface ActiveJobOrdersTableProps {
  initialData: ActiveJobOrder[];
}

/**
 * Staff's Active Job Orders — tracks the same 3-step creation-wizard progress
 * as Admin's own Active table. "Receipt Upload" always jumps into the wizard
 * at Step 2; "Generate Bill" only enables once Step 3 (Markup & Summary) is
 * done, and moves the row into the Pending list (see staffPendingJobOrdersStore.ts).
 */
export function ActiveJobOrdersTable({ initialData }: ActiveJobOrdersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatedBill, setGeneratedBill] = useState<{ jobOrderNo: string; fileName: string } | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.jobOrderNo, row.procurementNo].join(" ").toLowerCase().includes(q);
  });

  // Mock-only: "generating" the bill computes a dummy total from the job order's own
  // line items (jobOrderDetails.mock.ts), writes the resulting Pending row to
  // localStorage so it's genuinely there when the user navigates to Pending, then
  // removes it from this Active list — mirrors AdminActiveTable's own row-removal,
  // plus the PDF-generation simulation this table's spec calls for.
  const handleGenerateBill = (row: ActiveJobOrder) => {
    const fileName = `${row.jobOrderNo}-bill.pdf`;
    const detail = jobOrderDetailsByJobNumber[row.jobOrderNo];
    const amount = detail
      ? detail.lineItems.reduce(
          (sum, item) => sum + calculateLineItemTotals(item.qty, item.unitPrice).subTotal,
          0,
        )
      : 0;

    addGeneratedPendingJobOrder({
      // jobOrderNo, not row.id — row ids are small sequential mock ids that collide
      // across this table's and the Pending table's separate mock arrays.
      id: row.jobOrderNo,
      jobOrderNo: row.jobOrderNo,
      procurementNo: row.procurementNo,
      amount: Math.round(amount),
      dateSubmitted: formatDateISO(new Date()),
      stage: "Submitted",
    });

    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setGeneratedBill({ jobOrderNo: row.jobOrderNo, fileName });
  };

  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("activeJobOrders.searchPlaceholder")} />
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("activeJobOrders.jobOrderNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.procurementNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("activeJobOrders.uploadedDocument")}</th>
              <th className="py-2 pl-3 font-semibold">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-ink">{row.jobOrderNo}</td>
                <td className="px-3 py-2 text-ink">{row.procurementNo}</td>
                <td className="px-3 py-2">
                  <JobOrderDocumentCell documentName={row.documentName} onPreview={() => setPreviewId(row.id)} />
                </td>
                <td className="py-2 pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/staff/job-orders/create?step=2"
                      className="inline-flex items-center gap-1.5 rounded-none border border-transparent bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden />
                      {t("activeJobOrders.receiptUpload")}
                    </Link>

                    <button
                      type="button"
                      disabled={row.completedStep !== 3}
                      onClick={() => handleGenerateBill(row)}
                      className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
                    >
                      {t("activeJobOrders.generateBill")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  {t("activeJobOrders.noResults", { query })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={previewRow !== null} onClose={() => setPreviewId(null)} title={previewRow?.documentName ?? ""}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <FileText className="h-10 w-10 text-muted" aria-hidden />
          <p className="text-sm text-muted">{t("activeJobOrders.previewUnavailable")}</p>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {t("activeJobOrders.download")}
          </a>
        </div>
      </Modal>

      <Modal
        open={generatedBill !== null}
        onClose={() => setGeneratedBill(null)}
        title={t("activeJobOrders.billGeneratedTitle")}
      >
        {generatedBill && (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              {t("activeJobOrders.billGeneratedBody", {
                fileName: generatedBill.fileName,
                jobOrderNo: generatedBill.jobOrderNo,
              })}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGeneratedBill(null)}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

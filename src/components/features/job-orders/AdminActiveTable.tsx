"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import type { AdminActiveJobOrder, JobOrderCompletionStep } from "@/shared/types/job-order.types";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";

interface AdminActiveTableProps {
  initialData: AdminActiveJobOrder[];
}

const STEP_TONE: Record<JobOrderCompletionStep, BadgeTone> = {
  1: "blue",
  2: "blue",
  3: "green",
};

/**
 * Admin's Active Job Orders — status reflects creation-wizard progress (Step
 * 1/2/3), not the bill-document workflow Staff sees. "Generate Bill" is the
 * one action Admin needs here, and only once all 3 steps are done; the
 * Uploaded Document column/preview is unchanged from the original table.
 */
export function AdminActiveTable({ initialData }: AdminActiveTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const stepLabel = (step: JobOrderCompletionStep) =>
    step === 1
      ? t("activeJobOrders.step1Complete")
      : step === 2
        ? t("activeJobOrders.step2Complete")
        : t("activeJobOrders.readyForBilling");

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // Searches both the raw step number and its translated label, so the
    // query matches whatever the user actually sees in the badge.
    const haystack = [row.jobOrderNo, row.procurementNo, String(row.completedStep), stepLabel(row.completedStep)]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  // Mock-only: once billed, the row leaves Admin's Active list. A real backend
  // would create the corresponding Pending-payment record on the server side.
  const handleGenerateBill = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("activeJobOrders.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) => (
              <StatusBadge label={stepLabel(row.completedStep)} tone={STEP_TONE[row.completedStep]} />
            ),
          },
          {
            id: "document",
            header: t("activeJobOrders.uploadedDocument"),
            cell: (row) => (
              <JobOrderDocumentCell documentName={row.documentName} onPreview={() => setPreviewId(row.id)} />
            ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.completedStep === 3 ? (
                <button
                  type="button"
                  onClick={() => handleGenerateBill(row.id)}
                  className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
                >
                  {t("activeJobOrders.generateBill")}
                </button>
              ) : (
                <span className="text-xs text-muted">{t("activeJobOrders.awaitingSteps")}</span>
              ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("activeJobOrders.noResults", { query })}
      />

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
    </div>
  );
}

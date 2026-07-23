"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
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
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

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

  // Generates a real PDF bill, uploads it to S3, and records it on the Job Order — the row stays
  // in Active (no real "billed" state to move it to Pending yet), just gains a real document.
  const handleGenerateBill = async (id: string) => {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/generate-bill`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to generate bill.");
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, documentName: result.data.fileName, documentUrl: result.data.previewUrl } : row,
        ),
      );
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to generate bill.",
        variant: "error",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("activeJobOrders.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          {
            id: "jobOrderNo",
            header: t("activeJobOrders.jobOrderNo"),
            cell: (row) => (
              <Link
                href={`/admin/job-orders/create?id=${row.id}&step=1`}
                className="font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
              >
                {row.jobOrderNo}
              </Link>
            ),
          },
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
                  disabled={generatingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {generatingId === row.id
                    ? t("activeJobOrders.generatingBill")
                    : row.documentName
                      ? t("activeJobOrders.regenerateBill")
                      : t("activeJobOrders.generateBill")}
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
        {previewRow?.documentUrl ? (
          <div className="space-y-3">
            <iframe
              src={previewRow.documentUrl}
              title={previewRow.documentName ?? ""}
              className="h-[70vh] w-full rounded-none border border-border"
            />
            <div className="flex justify-end">
              <a
                href={previewRow.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t("activeJobOrders.download")}
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FileText className="h-10 w-10 text-muted" aria-hidden />
            <p className="text-sm text-muted">{t("activeJobOrders.previewUnavailable")}</p>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

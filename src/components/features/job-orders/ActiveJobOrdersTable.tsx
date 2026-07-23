"use client";

import { Download, FileText, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import type { ActiveJobOrder } from "@/shared/types/job-order.types";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";

interface ActiveJobOrdersTableProps {
  initialData: ActiveJobOrder[];
}

/**
 * Staff's Active Job Orders — tracks the same 3-step creation-wizard progress
 * as Admin's own Active table. "Receipt Upload" jumps into the wizard at Step
 * 2 (disabled once Step 3 is done); "Generate Bill" only enables once Step 3
 * (Markup & Summary) is done, and attaches a real generated PDF to the row.
 */
export function ActiveJobOrdersTable({ initialData }: ActiveJobOrdersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.jobOrderNo, row.procurementNo].join(" ").toLowerCase().includes(q);
  });

  // Generates a real PDF bill, uploads it to S3, and records it on the Job Order — the row stays
  // in Active (no real "billed" state to move it to Pending yet), just gains a real document.
  const handleGenerateBill = async (row: ActiveJobOrder) => {
    setGeneratingId(row.id);
    try {
      const res = await fetch(`/api/job-orders/${row.id}/generate-bill`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to generate bill.");
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, documentName: result.data.fileName, documentUrl: result.data.previewUrl } : r,
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
                <td className="py-2 pr-3">
                  <Link
                    href={`/staff/job-orders/create?id=${row.id}&step=1`}
                    className="font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
                  >
                    {row.jobOrderNo}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink">{row.procurementNo}</td>
                <td className="px-3 py-2">
                  <JobOrderDocumentCell documentName={row.documentName} onPreview={() => setPreviewId(row.id)} />
                </td>
                <td className="py-2 pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.completedStep === 3 ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted opacity-40"
                        title={t("activeJobOrders.receiptUploadDisabled")}
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden />
                        {t("activeJobOrders.receiptUpload")}
                      </span>
                    ) : (
                      <Link
                        href={`/staff/job-orders/create?id=${row.id}&step=2`}
                        className="inline-flex items-center gap-1.5 rounded-none border border-transparent bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden />
                        {t("activeJobOrders.receiptUpload")}
                      </Link>
                    )}

                    <button
                      type="button"
                      disabled={row.completedStep !== 3 || generatingId === row.id}
                      onClick={() => handleGenerateBill(row)}
                      className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
                    >
                      {generatingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {generatingId === row.id
                        ? t("activeJobOrders.generatingBill")
                        : row.documentName
                          ? t("activeJobOrders.regenerateBill")
                          : t("activeJobOrders.generateBill")}
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

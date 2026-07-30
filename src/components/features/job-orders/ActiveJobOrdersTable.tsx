"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import type { ActiveJobOrder } from "@/shared/types/job-order.types";
import { formatLKR } from "@/lib/utils/currency";

interface ActiveJobOrdersTableProps {
  initialData: ActiveJobOrder[];
}

/**
 * Staff's Active Job Orders — every row here is still short of being billed and verified (that's
 * what Job Order Pending tracks instead), so the status badge only ever shows "Job Pending" or
 * "Verification Pending" rather than a step-by-step wizard-progress label. Commission (Staff's own
 * profit share) is shown instead of Admin's Profit — see `AdminActiveTable`. Job Order No resumes
 * the wizard at any step; "Bill" is Staff's one row action here (generate once eligible, then send
 * to Admin for verification — Admin's own Verify action is what finally moves it to Pending).
 */
export function ActiveJobOrdersTable({ initialData }: ActiveJobOrdersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.jobOrderNo, row.procurementNo, row.procuringEntity].join(" ").toLowerCase().includes(q);
  });

  // Generates a real PDF bill, uploads it to S3, and records it on the Job Order.
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
          r.id === row.id
            ? {
                ...r,
                documentName: result.data.fileName,
                documentUrl: result.data.previewUrl,
                billSubmitted: result.data.billSubmitted,
              }
            : r,
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

  // Sends the generated bill to Admin for review — flips the status badge to "Verification
  // Pending"; the row itself stays in Active until Admin actually verifies it.
  const handleSendToAdmin = async (row: ActiveJobOrder) => {
    setSubmittingId(row.id);
    try {
      const res = await fetch(`/api/job-orders/${row.id}/submit-bill`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to send bill to Admin.");
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, billSubmitted: true } : r)));
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to send bill to Admin.",
        variant: "error",
      });
    } finally {
      setSubmittingId(null);
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
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("activeJobOrders.jobOrderNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("activeJobOrders.procurement")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.status")}</th>
              <th className="px-3 py-2 font-semibold">{t("activeJobOrders.total")}</th>
              <th className="px-3 py-2 font-semibold">{t("activeJobOrders.commission")}</th>
              <th className="px-3 py-2 font-semibold">{t("activeJobOrders.bill")}</th>
              <th className="py-2 pl-3 font-semibold">{t("activeJobOrders.createdDate")}</th>
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
                  {row.isAdminAssigned && (
                    <span className="mt-1 block w-fit rounded-none border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                      {t("activeJobOrders.adminAssignment")}
                    </span>
                  )}
                </td>
                <td className="max-w-[240px] px-3 py-2 text-ink break-words sm:max-w-[320px]">
                  {row.procurementNo} — {row.procuringEntity}
                </td>
                <td className="px-3 py-2">
                  {row.billSubmitted ? (
                    <StatusBadge label={t("activeJobOrders.statusVerificationPending")} tone="amber" />
                  ) : (
                    <StatusBadge label={t("activeJobOrders.statusJobPending")} tone="blue" />
                  )}
                </td>
                <td className="px-3 py-2 text-ink">{formatLKR(Math.round(row.total))}</td>
                <td className="px-3 py-2 text-ink">{formatLKR(Math.round(row.commissionValue))}</td>
                <td className="px-3 py-2">
                  {row.documentUrl ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewId(row.id)}
                        className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t("activeJobOrders.bill")}
                      </button>
                      {row.billSubmitted ? (
                        <span className="text-xs text-muted">{t("activeJobOrders.sentAwaitingVerification")}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendToAdmin(row)}
                          disabled={submittingId === row.id}
                          className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                          {submittingId === row.id
                            ? t("activeJobOrders.sendingToAdmin")
                            : t("activeJobOrders.sendToAdmin")}
                        </button>
                      )}
                    </div>
                  ) : row.status === "Completed" ? (
                    <button
                      type="button"
                      onClick={() => handleGenerateBill(row)}
                      disabled={generatingId === row.id}
                      className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generatingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {generatingId === row.id
                        ? t("activeJobOrders.generatingBill")
                        : t("activeJobOrders.generateBill")}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">{t("activeJobOrders.awaitingSteps")}</span>
                  )}
                </td>
                <td className="py-2 pl-3 text-ink">{row.createdAt}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted">
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

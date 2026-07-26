"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import type { AdminActiveJobOrder } from "@/shared/types/job-order.types";
import { formatLKR } from "@/lib/utils/currency";

interface AdminActiveTableProps {
  initialData: AdminActiveJobOrder[];
}

/**
 * Admin's Active Job Orders — every row here is, by definition, still short of being billed and
 * verified (that's what Job Order Pending tracks instead), so the status badge only ever shows
 * "Job Pending" or "Verification Pending" rather than a step-by-step wizard-progress label. Profit
 * (the company's own share, `markupValue`) is Admin-only — Staff's own table shows Commission
 * instead, see `ActiveJobOrdersTable`. "Bill" generates/opens the bill; the Action column's
 * "Regenerate Bill" lets Admin redo it, and "Verify" (only once Staff has sent it, or immediately
 * for a bill Admin generated themselves) is what actually moves the row into Job Order Pending.
 */
export function AdminActiveTable({ initialData }: AdminActiveTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [row.jobOrderNo, row.procurementNo, row.procuringEntity].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  // Generates a real PDF bill, uploads it to S3, and records it on the Job Order.
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
          row.id === id
            ? {
                ...row,
                documentName: result.data.fileName,
                documentUrl: result.data.previewUrl,
                billSubmitted: result.data.billSubmitted,
              }
            : row,
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

  // Approving the bill moves the row out of Active entirely — Job Order Pending is where it lives
  // next, so it's simply dropped from local state on success rather than patched in place.
  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/verify-bill`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to verify bill.");
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to verify bill.",
        variant: "error",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const previewRow = rows.find((row) => row.id === previewId) ?? null;
  const detailsRow = rows.find((row) => row.id === detailsId) ?? null;

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
          {
            id: "procurement",
            header: t("activeJobOrders.procurement"),
            cell: (row) => (
              <span className="block max-w-[240px] text-ink break-words sm:max-w-[320px]">
                {row.procurementNo} — {row.procuringEntity}
              </span>
            ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              row.billSubmitted ? (
                <StatusBadge label={t("activeJobOrders.statusVerificationPending")} tone="amber" />
              ) : (
                <StatusBadge label={t("activeJobOrders.statusJobPending")} tone="blue" />
              ),
          },
          { id: "total", header: t("activeJobOrders.total"), cell: (row) => formatLKR(Math.round(row.total)) },
          { id: "profit", header: t("activeJobOrders.profit"), cell: (row) => formatLKR(Math.round(row.profit)) },
          {
            id: "bill",
            header: t("activeJobOrders.bill"),
            cell: (row) =>
              row.documentUrl ? (
                <button
                  type="button"
                  onClick={() => setPreviewId(row.id)}
                  className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  {t("activeJobOrders.bill")}
                </button>
              ) : row.status === "Completed" ? (
                <button
                  type="button"
                  onClick={() => handleGenerateBill(row.id)}
                  disabled={generatingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {generatingId === row.id ? t("activeJobOrders.generatingBill") : t("activeJobOrders.generateBill")}
                </button>
              ) : (
                <span className="text-xs text-muted">{t("activeJobOrders.awaitingSteps")}</span>
              ),
          },
          { id: "createdAt", header: t("activeJobOrders.createdDate"), cell: (row) => row.createdAt },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) =>
              row.documentUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailsId(row.id)}
                    className="inline-flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
                  >
                    {t("activeJobOrders.details")}
                  </button>
                  {row.billSubmitted && (
                    <button
                      type="button"
                      onClick={() => handleVerify(row.id)}
                      disabled={verifyingId === row.id}
                      className="inline-flex items-center gap-1.5 rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {verifyingId === row.id ? t("activeJobOrders.verifying") : t("activeJobOrders.verify")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGenerateBill(row.id)}
                    disabled={generatingId === row.id}
                    className="inline-flex items-center gap-1.5 rounded-none border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    {generatingId === row.id ? t("activeJobOrders.generatingBill") : t("activeJobOrders.regenerateBill")}
                  </button>
                  {!row.billSubmitted && (
                    <span className="text-xs text-muted">{t("activeJobOrders.awaitingSubmission")}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted">—</span>
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

      <Modal open={detailsRow !== null} onClose={() => setDetailsId(null)} title={t("activeJobOrders.reviewHeading")}>
        {detailsRow && (
          <div className="space-y-4">
            <div className="rounded-none border border-border bg-surface p-3">
              <p className="text-xs text-muted">{t("activeJobOrders.billAmount")}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {detailsRow.billAmount !== null ? formatLKR(Math.round(detailsRow.billAmount)) : "—"}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {t("activeJobOrders.otherExpensesHeading")}
              </h3>
              {detailsRow.otherExpenses.length === 0 ? (
                <p className="text-sm text-muted">{t("activeJobOrders.noOtherExpenses")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {detailsRow.otherExpenses.map((expense, index) => (
                        <tr key={index} className="border-b border-border last:border-b-0">
                          <td className="py-2 pr-3 text-ink">{expense.label}</td>
                          <td className="py-2 pl-3 text-right text-ink">{formatLKR(Math.round(expense.amount))}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-3 pr-3 font-semibold text-ink">{t("activeJobOrders.total")}</td>
                        <td className="pt-3 pl-3 text-right font-semibold text-ink">
                          {formatLKR(Math.round(detailsRow.otherExpensesTotal))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

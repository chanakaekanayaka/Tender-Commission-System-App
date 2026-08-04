"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import type { AdminActiveJobOrder, JobOrderExpenseBreakdownItem } from "@/shared/types/job-order.types";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";

interface AdminActiveTableProps {
  data: AdminActiveJobOrder[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
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
export function AdminActiveTable({ data, search, page, totalPages, total }: AdminActiveTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [expensePreview, setExpensePreview] = useState<JobOrderExpenseBreakdownItem | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Generates a real PDF bill, uploads it to S3, and records it on the Job Order.
  const handleGenerateBill = async (id: string) => {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/generate-bill`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to generate bill.");
      }
      router.refresh();
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
  // next, so a refresh (not a local splice) is what keeps this page's pagination/total accurate.
  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/verify-bill`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to verify bill.");
      }
      router.refresh();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to verify bill.",
        variant: "error",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Soft delete — the row leaves Active for good (surfaces in History instead, marked "Deleted"),
  // so it's refreshed from the server on success, same as a successful Verify.
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/job-orders/${id}/delete`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete job order.");
      }
      setDeleteConfirmId(null);
      router.refresh();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to delete job order.",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const previewRow = data.find((row) => row.id === previewId) ?? null;
  const detailsRow = data.find((row) => row.id === detailsId) ?? null;
  const deleteConfirmRow = data.find((row) => row.id === deleteConfirmId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("activeJobOrders.searchPlaceholder")} />
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
                      className="inline-flex items-center gap-1.5 rounded-none bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {verifyingId === row.id ? t("activeJobOrders.verifying") : t("activeJobOrders.verify")}
                    </button>
                  )}
                  {!row.billSubmitted && (
                    <span className="text-xs text-muted">{t("activeJobOrders.awaitingSubmission")}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(row.id)}
                    className="inline-flex items-center gap-1.5 rounded-none border border-red-600 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("activeJobOrders.delete")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(row.id)}
                  className="inline-flex items-center gap-1.5 rounded-none border border-red-600 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  {t("activeJobOrders.delete")}
                </button>
              ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("activeJobOrders.noResults", { query: searchValue })}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

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
              <p className="text-xs text-muted">{t("activeJobOrders.expensesAmount")}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatLKR(Math.round(detailsRow.otherExpensesTotal))}
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
                          <td className="py-2 pr-3 text-ink">
                            {expense.fileUrl ? (
                              <button
                                type="button"
                                onClick={() => setExpensePreview(expense)}
                                className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
                              >
                                <FileText className="h-3.5 w-3.5" aria-hidden />
                                {expense.label}
                              </button>
                            ) : (
                              expense.label
                            )}
                          </td>
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

      <DocumentPreviewModal
        open={expensePreview !== null}
        onClose={() => setExpensePreview(null)}
        fileName={expensePreview?.label}
        fileType={expensePreview?.fileType}
        url={expensePreview?.fileUrl}
      />

      <Modal
        open={deleteConfirmRow !== null}
        onClose={() => setDeleteConfirmId(null)}
        title={t("activeJobOrders.deleteConfirmTitle")}
      >
        {deleteConfirmRow && (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              {t("activeJobOrders.deleteConfirmMessage", { jobOrderNo: deleteConfirmRow.jobOrderNo })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmRow.id)}
                disabled={deletingId === deleteConfirmRow.id}
                className="inline-flex items-center gap-1.5 rounded-none bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteConfirmRow.id && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {deletingId === deleteConfirmRow.id ? t("activeJobOrders.deleting") : t("activeJobOrders.delete")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

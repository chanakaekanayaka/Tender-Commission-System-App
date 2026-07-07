"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import type { ActiveJobOrder, JobOrderStatus } from "@/shared/types/job-order.types";
import { AdminJobOrderActions } from "@/components/features/job-orders/AdminJobOrderActions";
import { JobOrderDocumentCell } from "@/components/features/job-orders/JobOrderDocumentCell";
import { StaffJobOrderActions } from "@/components/features/job-orders/StaffJobOrderActions";

interface ActiveJobOrdersTableProps {
  role: "admin" | "staff";
  initialData: ActiveJobOrder[];
}

const STATUS_TONE: Record<JobOrderStatus, BadgeTone> = {
  Pending: "amber",
  "Bill Created": "blue",
  Verified: "green",
};

/**
 * Active Job Orders — shared table shell for both roles. Admin and Staff see
 * identical columns; only the "Actions" cell swaps (Verify vs Upload), which
 * also drives the workflow: Staff's upload flips a row from Pending → Bill
 * Created, and only then can Admin Verify it → Verified.
 */
export function ActiveJobOrdersTable({ role, initialData }: ActiveJobOrdersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const statusLabel = (status: JobOrderStatus) =>
    status === "Pending"
      ? t("activeJobOrders.statusPending")
      : status === "Bill Created"
        ? t("activeJobOrders.statusBillCreated")
        : t("activeJobOrders.statusVerified");

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // Searches both the raw status and its translated label, so the query
    // matches whatever the user actually sees in the badge.
    const haystack = [row.jobOrderNo, row.procurementNo, row.status, statusLabel(row.status)]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  const handleUpload = (id: string, fileName: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, documentName: fileName, status: "Bill Created" } : row)),
    );
  };

  const handleVerify = (id: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "Verified" } : row)));
  };

  const previewRow = rows.find((row) => row.id === previewId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("activeJobOrders.searchPlaceholder")} />
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("activeJobOrders.jobOrderNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.procurementNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.status")}</th>
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
                  <StatusBadge label={statusLabel(row.status)} tone={STATUS_TONE[row.status]} />
                </td>
                <td className="px-3 py-2">
                  <JobOrderDocumentCell documentName={row.documentName} onPreview={() => setPreviewId(row.id)} />
                </td>
                <td className="py-2 pl-3">
                  {role === "admin" ? (
                    <AdminJobOrderActions status={row.status} onVerify={() => handleVerify(row.id)} />
                  ) : (
                    <StaffJobOrderActions
                      jobOrderNo={row.jobOrderNo}
                      status={row.status}
                      onUpload={(fileName) => handleUpload(row.id, fileName)}
                    />
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
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
    </div>
  );
}

"use client";

import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { DocumentPreviewModal } from "@/components/features/job-orders/DocumentPreviewModal";
import type { CommissionHistoryRecord } from "@/shared/types/commission.types";

interface StaffCommissionHistoryProps {
  data: CommissionHistoryRecord[];
}

/**
 * Staff's Commission History — read-only record of their own already-paid, confirmed commissions,
 * including the receipt Admin uploaded at payout time so it stays reviewable after the fact, not
 * just while it was Pending. Client-only because of the search box + receipt preview state, same
 * split as AdminCommissionHistory.
 */
export function StaffCommissionHistory({ data }: StaffCommissionHistoryProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = data.filter((row) => row.jobOrderNo.toLowerCase().includes(query.trim().toLowerCase()));
  const previewRow = data.find((row) => row.id === previewId) ?? null;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("commissions.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "jobOrderNo", header: t("commissions.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "amount", header: t("commissions.amount"), cell: (row) => formatLKR(row.amount) },
          { id: "uploadedAt", header: t("commissions.uploadTime"), cell: (row) => row.uploadedAt },
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo ?? "—" },
          {
            id: "receipt",
            header: t("commissions.receipt"),
            cell: (row) => (
              <button
                type="button"
                onClick={() => setPreviewId(row.id)}
                className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-border underline-offset-2 hover:text-active"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                <span className="max-w-[8rem] truncate">{row.receiptFileName}</span>
                <Eye className="h-3.5 w-3.5 text-muted" aria-hidden />
              </button>
            ),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("commissions.paidStatus")} tone="green" />,
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("commissions.noHistory")}
      />

      <DocumentPreviewModal
        open={previewRow !== null}
        onClose={() => setPreviewId(null)}
        fileName={previewRow?.receiptFileName}
        fileType={previewRow?.receiptFileType}
        url={previewRow?.receiptUrl}
      />
    </div>
  );
}

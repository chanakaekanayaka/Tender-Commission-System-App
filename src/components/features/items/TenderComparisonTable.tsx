"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { STATUS_LABEL_KEY, STATUS_TONE } from "@/components/features/items/marketAnalysisShared";
import { TenderComparisonDetailModal } from "@/components/features/items/TenderComparisonDetailModal";
import type { TenderMarketComparison } from "@/shared/types/marketAnalysis.types";

interface TenderComparisonTableProps {
  data: TenderMarketComparison[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

/**
 * One compact row per uploaded vendor comparison Excel — every upload feeds this view directly,
 * whether or not it's been linked to a Price Schedule (see Pending Excel Uploads); linking there
 * only attaches a procurement no for reference, it isn't required to appear here. The full
 * item-by-item comparison lives behind the "Summary" action (TenderComparisonDetailModal) instead
 * of being permanently expanded on the page — that was a wall of scrolling once there were more
 * than a couple of uploads.
 */
export function TenderComparisonTable({ data, page, totalPages, total, limit }: TenderComparisonTableProps) {
  const { t } = useTranslation();
  // No search box on this view — reused purely for its URL-synced `page` state/nav.
  const { page: currentPage, setPage } = useTableQueryState({ search: "", page });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.find((c) => c.uploadId === selectedId) ?? null;

  return (
    <div>
      <DataTable
        columns={[
          {
            id: "fileName",
            header: t("marketAnalysis.fileName"),
            cell: (row) => (
              <span>
                <span className="font-medium text-ink">{row.procurementNo ?? row.fileName}</span>
                {row.procurementNo && <span className="block text-xs text-muted">{row.fileName}</span>}
              </span>
            ),
          },
          { id: "uploadedAt", header: t("priceScheduleHistory.uploadedDate"), cell: (row) => row.uploadedAt },
          {
            id: "status",
            header: t("vendorExcelUploads.status"),
            cell: (row) =>
              row.status !== "Unknown" && (
                <StatusBadge label={t(STATUS_LABEL_KEY[row.status])} tone={STATUS_TONE[row.status]} />
              ),
          },
          {
            id: "ourTotal",
            header: t("marketAnalysis.total"),
            cell: (row) => (row.ourTotal !== null ? formatLKR(row.ourTotal) : <span className="text-muted">—</span>),
          },
          {
            id: "actions",
            header: "",
            cell: (row) => (
              <button
                type="button"
                onClick={() => setSelectedId(row.uploadId)}
                className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:bg-active/90"
              >
                {t("marketAnalysis.summary")}
              </button>
            ),
          },
        ]}
        data={data}
        rowKey={(row) => row.uploadId}
        emptyMessage={t("marketAnalysis.noComparisons")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={limit} />

      {selected && <TenderComparisonDetailModal comparison={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

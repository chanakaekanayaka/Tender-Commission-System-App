"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

type ExportFormat = "pdf" | "csv" | "excel";

const EXPORT_OPTIONS: { format: ExportFormat; labelKey: "priceScheduleHistory.exportPdf" | "priceScheduleHistory.exportCsv" | "priceScheduleHistory.exportExcel"; icon: typeof FileText }[] = [
  { format: "pdf", labelKey: "priceScheduleHistory.exportPdf", icon: FileText },
  { format: "csv", labelKey: "priceScheduleHistory.exportCsv", icon: FileSpreadsheet },
  { format: "excel", labelKey: "priceScheduleHistory.exportExcel", icon: FileSpreadsheet },
];

const EXPORT_FILE_EXTENSION: Record<ExportFormat, string> = { pdf: "pdf", csv: "csv", excel: "xlsx" };

interface ExportMenuProps {
  /** Ids of the rows currently visible (i.e. matching the active search filter) to export. */
  rowIds: string[];
}

function ExportMenu({ rowIds }: ExportMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    if (rowIds.length === 0) return;

    setIsExporting(true);
    setToast(null);

    try {
      const res = await fetch("/api/price-schedules/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, ids: rowIds }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.message ?? "Failed to export.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `price-schedules.${EXPORT_FILE_EXTENSION[format]}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to export.", variant: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isExporting}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden />
        {isExporting ? t("priceScheduleHistory.exporting") : t("priceScheduleHistory.export")}
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-none border border-border bg-card shadow-sm">
          {EXPORT_OPTIONS.map(({ format, labelKey, icon: Icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-active/5"
            >
              <Icon className="h-4 w-4 text-muted" aria-hidden />
              {t(labelKey)}
            </button>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

interface PriceScheduleHistoryTableProps {
  data: PriceScheduleSummary[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
  /** Every id matching the current search, not just this page's — what Export actually exports. */
  allMatchingIds: string[];
}

/** Search matches procurementNo/procuringEntity (raw fields) server-side — not the formatted
 *  currency/translated status text a client-side filter could previously match. */
export function PriceScheduleHistoryTable({
  data,
  search,
  page,
  totalPages,
  total,
  allMatchingIds,
}: PriceScheduleHistoryTableProps) {
  const { t } = useTranslation();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={searchValue}
          onChange={setSearch}
          placeholder={t("priceScheduleHistory.searchPlaceholder")}
        />

        <ExportMenu rowIds={allMatchingIds} />
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("common.procurementNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.procuringEntity")}</th>
              <th className="px-3 py-2 font-semibold">{t("priceScheduleHistory.uploadedDate")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.closingDate")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.totalValue")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-ink">{row.procurementNo}</td>
                <td className="px-3 py-2 text-ink">{row.entity}</td>
                <td className="px-3 py-2 text-muted">{row.uploadedAt}</td>
                <td className="px-3 py-2 text-muted">{row.closingDate}</td>
                <td className="px-3 py-2 text-ink">{formatLKR(row.totalValue)}</td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  {t("priceScheduleHistory.noResults", { query: searchValue })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />
    </div>
  );
}

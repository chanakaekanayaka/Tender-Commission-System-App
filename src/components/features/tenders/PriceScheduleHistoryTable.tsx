"use client";

import { ChevronDown, Download, Eye, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

type ExportFormat = "pdf" | "csv" | "excel";

const EXPORT_OPTIONS: { format: ExportFormat; labelKey: "priceScheduleHistory.exportPdf" | "priceScheduleHistory.exportCsv" | "priceScheduleHistory.exportExcel"; icon: typeof FileText }[] = [
  { format: "pdf", labelKey: "priceScheduleHistory.exportPdf", icon: FileText },
  { format: "csv", labelKey: "priceScheduleHistory.exportCsv", icon: FileSpreadsheet },
  { format: "excel", labelKey: "priceScheduleHistory.exportExcel", icon: FileSpreadsheet },
];

function ExportMenu() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Mock export — no file generation yet, just closes the menu once a format is picked.
  const handleExport = (_format: ExportFormat) => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t("priceScheduleHistory.export")}
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
    </div>
  );
}

interface PriceScheduleHistoryTableProps {
  data: PriceScheduleSummary[];
}

export function PriceScheduleHistoryTable({ data }: PriceScheduleHistoryTableProps) {
  const { t } = useTranslation();
  // Only the search box needs client state — the table itself would be static
  // markup if not for filtering it reactively against that input.
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const statusLabel = row.status === "Completed" ? t("status.completed") : t("status.draft");
    // Searches every visible column — including the formatted currency string
    // and the translated status label — so the query matches whatever the
    // user actually sees in the table, not just the raw underlying values.
    const haystack = [
      row.procurementNo,
      row.entity,
      row.closingDate,
      formatLKR(row.totalValue),
      String(row.totalValue),
      row.status,
      statusLabel,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("priceScheduleHistory.searchPlaceholder")}
        />

        <ExportMenu />
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("common.procurementNo")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.procuringEntity")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.closingDate")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.totalValue")}</th>
              <th className="px-3 py-2 font-semibold">{t("common.status")}</th>
              <th className="py-2 pl-3 font-semibold">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-ink">{row.procurementNo}</td>
                <td className="px-3 py-2 text-ink">{row.entity}</td>
                <td className="px-3 py-2 text-muted">{row.closingDate}</td>
                <td className="px-3 py-2 text-ink">{formatLKR(row.totalValue)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-none px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Completed"
                        ? "bg-active text-active-ink"
                        : "border border-border text-muted"
                    }`}
                  >
                    {row.status === "Completed" ? t("status.completed") : t("status.draft")}
                  </span>
                </td>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-2 text-muted">
                    <button type="button" aria-label={t("common.view")} className="hover:text-ink">
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  {t("priceScheduleHistory.noResults", { query })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

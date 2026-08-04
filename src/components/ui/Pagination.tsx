import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total row count and page size — when both are given, the label reads "Showing X–Y of Z"
   *  instead of just "Page X of Y". Used by backend-paginated tables where the total is real. */
  total?: number;
  limit?: number;
}

/** Reusable prev/next pager — shared by every paginated list (backend- or client-paginated).
 *  Renders nothing when everything fits on one page. */
export function Pagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const rangeLabel =
    total !== undefined && limit !== undefined
      ? t("common.showingRange", {
          from: total === 0 ? 0 : (page - 1) * limit + 1,
          to: Math.min(page * limit, total),
          total,
        })
      : t("common.pageOf", { page, totalPages });

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <p className="text-xs text-muted">{rangeLabel}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("common.previous")}
          className="flex items-center gap-1 rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("common.previous")}</span>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={t("common.next")}
          className="flex items-center gap-1 rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">{t("common.next")}</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

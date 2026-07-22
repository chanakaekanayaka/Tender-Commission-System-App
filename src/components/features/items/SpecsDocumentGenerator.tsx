"use client";

import { useMemo, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import type { CatalogItem } from "@/shared/types/item.types";

interface SpecsDocumentGeneratorProps {
  items: CatalogItem[];
}

const PAGE_SIZE = 10;

/** Client Component — owns checkbox selection state and downloads the server-generated PDF, so
 *  this is the sole client boundary in "Create Specs Doc". */
export function SpecsDocumentGenerator({ items }: SpecsDocumentGeneratorProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(q));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  // "Select all" applies to every item matching the current search, not just the visible page —
  // selections made under a different search term are left untouched.
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredItems.forEach((item) => next.delete(item.id));
      } else {
        filteredItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    setIsGenerating(true);
    setToast(null);

    try {
      const res = await fetch("/api/items/specs-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.message ?? "Failed to generate document.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "item-specs.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to generate document.", variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
        <SearchInput value={query} onChange={handleQueryChange} placeholder={t("items.searchPlaceholder")} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  aria-label={t("items.selectAll")}
                  className="h-4 w-4 rounded-none border-border"
                />
              </th>
              <th className="px-3 py-2 font-semibold">{t("items.itemName")}</th>
              <th className="py-2 pl-3 font-semibold">{t("items.itemCode")}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={item.name}
                    className="h-4 w-4 rounded-none border-border"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-ink">{item.name}</td>
                <td className="py-2 pl-3 text-muted">{item.code}</td>
              </tr>
            ))}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted">
                  {query ? t("items.noResults", { query }) : t("items.noItems")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{t("items.selectedCount", { count: selectedIds.size })}</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedIds.size === 0 || isGenerating}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? t("items.generating") : t("items.generatePdf")}
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

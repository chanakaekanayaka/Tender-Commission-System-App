"use client";

import { useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { openItemSpecsDocument } from "@/lib/utils/openItemSpecsDocument";
import type { CatalogItem } from "@/shared/types/item.types";

interface SpecsDocumentGeneratorProps {
  items: CatalogItem[];
}

/** Client Component — owns checkbox selection state and triggers the print-based document, so this is the sole client boundary in "Create Specs Doc". */
export function SpecsDocumentGenerator({ items }: SpecsDocumentGeneratorProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  };

  const handleGenerate = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    openItemSpecsDocument({
      companyName: defaultSystemConfig.companyName,
      title: t("items.createSpecsDocTitle"),
      items: selectedItems.map((item) => ({
        code: item.code,
        name: item.name,
        imageUrl: item.imageUrl,
        specs: item.specs,
      })),
    });
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
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
            {items.map((item) => (
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

            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted">
                  {t("items.noItems")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{t("items.selectedCount", { count: selectedIds.size })}</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedIds.size === 0}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("items.generatePdf")}
        </button>
      </div>
    </div>
  );
}

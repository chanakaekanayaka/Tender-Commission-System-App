"use client";

import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { MarketAnalysisEntry } from "@/shared/types/item.types";

interface MarketAnalysisTableProps {
  data: MarketAnalysisEntry[];
}

function PriceList({ prices }: { prices: number[] }) {
  return (
    <ul className="space-y-0.5">
      {prices.map((price, i) => (
        <li key={i}>{formatLKR(price)}</li>
      ))}
    </ul>
  );
}

/** Client Component — local search state, so this is the sole client boundary in "Market Analysis" (mirrors PriceScheduleHistoryTable's bespoke, non-DataTable pattern). */
export function MarketAnalysisTable({ data }: MarketAnalysisTableProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => row.itemName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("items.searchPlaceholder")} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("items.itemName")}</th>
              <th className="px-3 py-2 font-semibold">{t("items.ourBiddingPrices")}</th>
              <th className="px-3 py-2 font-semibold">{t("items.othersLowestPrices")}</th>
              <th className="px-3 py-2 font-semibold">{t("items.suppliedQty")}</th>
              <th className="py-2 pl-3 font-semibold">{t("items.bidQty")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-ink">{row.itemName}</td>
                <td className="px-3 py-2 text-ink">
                  <PriceList prices={row.ourBiddingPrices} />
                </td>
                <td className="px-3 py-2 text-ink">
                  <PriceList prices={row.othersLowestPrices} />
                </td>
                <td className="px-3 py-2 text-ink">{row.suppliedQty}</td>
                <td className="py-2 pl-3 text-ink">{row.bidQty}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  {t("items.noResults", { query })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

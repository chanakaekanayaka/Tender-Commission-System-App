"use client";

import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { priceCell, STATUS_LABEL_KEY, STATUS_TONE } from "@/components/features/items/marketAnalysisShared";
import type { TenderMarketComparison } from "@/shared/types/marketAnalysis.types";

interface TenderComparisonDetailModalProps {
  comparison: TenderMarketComparison;
  onClose: () => void;
}

/** Full item-by-item comparison for one uploaded Excel — the "Summary" action on the market
 *  analysis list opens this instead of every upload's table being permanently expanded on the
 *  page, which was a wall of scrolling once there were more than a couple of uploads. */
export function TenderComparisonDetailModal({ comparison, onClose }: TenderComparisonDetailModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={
        <span className="flex flex-wrap items-center gap-2 normal-case">
          <span className="font-semibold text-ink">{comparison.procurementNo ?? comparison.fileName}</span>
          <span className="text-muted"> · {comparison.uploadedAt}</span>
          {comparison.status !== "Unknown" && (
            <StatusBadge label={t(STATUS_LABEL_KEY[comparison.status])} tone={STATUS_TONE[comparison.status]} />
          )}
        </span>
      }
    >
      {comparison.procurementNo && <p className="mb-3 text-sm text-muted">{comparison.fileName}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("marketAnalysis.item")}</th>
              <th className="px-3 py-2 font-semibold">{t("marketAnalysis.qty")}</th>
              <th className="px-3 py-2 font-semibold">{t("marketAnalysis.ourPrice")}</th>
              {comparison.vendorNames.map((name) => (
                <th key={name} className="px-3 py-2 font-semibold">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.items.map((item, i) => {
              const allPrices = [item.ourPrice, ...item.otherPrices.map((p) => p.price)].filter(
                (p): p is number => p !== null,
              );
              const lowest = allPrices.length > 0 ? Math.min(...allPrices) : null;
              return (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 font-medium text-ink">{item.itemName}</td>
                  <td className="px-3 py-2 text-ink">{item.qty}</td>
                  <td className="px-3 py-2">{priceCell(item.ourPrice, lowest !== null && item.ourPrice === lowest)}</td>
                  {item.otherPrices.map((p) => (
                    <td key={p.vendorName} className="px-3 py-2">
                      {priceCell(p.price, lowest !== null && p.price === lowest)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border text-sm font-semibold">
              <td className="py-2 pr-3 text-ink">{t("marketAnalysis.total")}</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2">
                {comparison.ourTotal !== null ? (
                  <span
                    className={
                      comparison.status === "Won" ? "text-green-700" : comparison.status === "Lost" ? "text-red-700" : "text-ink"
                    }
                  >
                    {formatLKR(comparison.ourTotal)}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              {comparison.vendorNames.map((name, i) => (
                <td key={name} className="px-3 py-2 text-ink">
                  {formatLKR(comparison.vendorTotals[i])}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>
  );
}

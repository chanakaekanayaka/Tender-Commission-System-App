import { useTranslation } from "@/context/LanguageContext";
import { formatAmount, formatLKR } from "@/lib/utils/currency";
import { calculateLineItemTotals, DEFAULT_VAT_RATE } from "@/lib/utils/pricing";
import type { PriceScheduleLineItem } from "@/shared/types/tender.types";

interface LineItemsTableProps {
  items: PriceScheduleLineItem[];
  /** Real VAT rate from System Config — falls back to DEFAULT_VAT_RATE if not yet loaded. */
  vatRate?: number;
}

/** Fully read-only review of the OCR-extracted rows — no add/remove/edit; a misread document is
 *  fixed by re-parsing it, not by hand-correcting rows here. */
export function LineItemsTable({ items, vatRate = DEFAULT_VAT_RATE }: LineItemsTableProps) {
  const { t } = useTranslation();

  const totals = items.reduce(
    (acc, row) => {
      const { vat, subTotal } = calculateLineItemTotals(row.qty, row.unitPrice, vatRate);
      return { vat: acc.vat + vat, subTotal: acc.subTotal + subTotal };
    },
    { vat: 0, subTotal: 0 },
  );

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("lineItems.heading")}</p>
        <p className="text-xs text-muted">{t("lineItems.count", { count: items.length })}</p>
      </div>

      {/* Scrollable on small screens per AI_INSTRUCTIONS.md §C */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase">
              <th className="py-2 pr-3 font-semibold">{t("lineItems.no")}</th>
              <th className="px-3 py-2 font-semibold">{t("lineItems.itemDescription")}</th>
              <th className="px-3 py-2 font-semibold">{t("lineItems.qty")}</th>
              <th className="px-3 py-2 font-semibold">{t("lineItems.unitPrice")}</th>
              <th className="px-3 py-2 font-semibold">{t("lineItems.vat", { rate: Math.round(vatRate * 100) })}</th>
              <th className="px-3 py-2 font-semibold">{t("lineItems.subTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  {t("lineItems.empty")}
                </td>
              </tr>
            )}
            {items.map((row, index) => {
              const { vat, subTotal } = calculateLineItemTotals(row.qty, row.unitPrice, vatRate);

              return (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-muted">{index + 1}</td>
                  <td className="py-2 pr-3 text-ink">{row.item || t("lineItems.untitledItem")}</td>
                  <td className="px-3 py-2 text-ink">{row.qty}</td>
                  <td className="px-3 py-2 text-ink">{formatAmount(row.unitPrice)}</td>
                  <td className="px-3 py-2 text-ink">{formatAmount(vat)}</td>
                  <td className="px-3 py-2 font-medium text-ink">{formatAmount(subTotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-ink">
              <td className="py-2 pr-3" />
              <td className="py-2 pr-3">{t("lineItems.totals")}</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2">{formatLKR(Math.round(totals.vat))}</td>
              <td className="px-3 py-2">{formatLKR(Math.round(totals.subTotal))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

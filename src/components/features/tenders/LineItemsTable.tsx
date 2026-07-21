import { Trash2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { formatAmount, formatLKR } from "@/lib/utils/currency";
import { calculateLineItemTotals, DEFAULT_VAT_RATE } from "@/lib/utils/pricing";
import type { PriceScheduleLineItem } from "@/shared/types/tender.types";

interface LineItemsTableProps {
  items: PriceScheduleLineItem[];
  onChange: (items: PriceScheduleLineItem[]) => void;
  /** Real VAT rate from System Config — falls back to DEFAULT_VAT_RATE if not yet loaded. */
  vatRate?: number;
}

/** Read-only review of the OCR-extracted rows — values aren't editable in place; a misread row
 *  is removed here and the source document re-parsed instead of being hand-corrected inline. */
export function LineItemsTable({ items, onChange, vatRate = DEFAULT_VAT_RATE }: LineItemsTableProps) {
  const { t } = useTranslation();

  const totals = items.reduce(
    (acc, row) => {
      const { vat, subTotal } = calculateLineItemTotals(row.qty, row.unitPrice, vatRate);
      return { vat: acc.vat + vat, subTotal: acc.subTotal + subTotal };
    },
    { vat: 0, subTotal: 0 },
  );

  const removeRow = (id: string) => {
    onChange(items.filter((row) => row.id !== id));
  };

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
              <th className="py-2 pl-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted">
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
                  <td className="py-2 pl-3">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={t("common.delete")}
                      className="text-muted hover:text-ink"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
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
              <td className="py-2 pl-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

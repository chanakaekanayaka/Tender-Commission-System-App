import type { BadgeTone } from "@/components/ui/StatusBadge";
import { formatLKR } from "@/lib/utils/currency";
import type { TenderWinStatus } from "@/shared/types/marketAnalysis.types";

export const STATUS_TONE: Record<TenderWinStatus, BadgeTone> = { Won: "green", Lost: "red", Unknown: "neutral" };

export const STATUS_LABEL_KEY = {
  Won: "marketAnalysis.statusWon",
  Lost: "marketAnalysis.statusLost",
  Unknown: "marketAnalysis.statusUnknown",
} as const satisfies Record<TenderWinStatus, string>;

/** Bold + green when this cell is the lowest quoted price in its row (including our own price) —
 *  the whole point of this view is seeing at a glance whether we're competitive on each item. */
export function priceCell(price: number | null, isLowest: boolean) {
  if (price === null) return <span className="text-muted">—</span>;
  return <span className={isLowest ? "font-semibold text-green-700" : "text-ink"}>{formatLKR(price)}</span>;
}

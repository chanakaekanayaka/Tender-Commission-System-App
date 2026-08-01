"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

interface JobOrderSummaryCardProps {
  originalTotal: number;
  newTotal: number;
  markupValue: number;
  commissionValue: number;
  otherExpensesTotal: number;
  /** New Total minus Other Expenses — shown as the bottom-line figure, labeled "Loss" and red when
   *  negative, "Overall Profit" and green otherwise. Same number for both roles. */
  overallProfit: number;
}

const FLASH_DURATION_MS = 700;

/** True for `FLASH_DURATION_MS` right after `value` changes — drives the flash-on-update color transition below, not a full animation. */
function useFlashOnChange(value: number) {
  const [isFlashing, setIsFlashing] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    setIsFlashing(true);
    const timeout = setTimeout(() => setIsFlashing(false), FLASH_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  return isFlashing;
}

function SummaryRow({
  label,
  value,
  muted = false,
  flash = false,
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
  flash?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`text-sm ${muted ? "text-muted" : "text-ink"}`}>{label}</dt>
      <dd
        className={`text-sm font-semibold transition-colors duration-700 ease-out ${
          flash ? "text-emerald-600" : muted ? "text-muted" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function JobOrderSummaryCard({
  originalTotal,
  newTotal,
  markupValue,
  commissionValue,
  otherExpensesTotal,
  overallProfit,
}: JobOrderSummaryCardProps) {
  const { t } = useTranslation();
  const removedValue = originalTotal - newTotal;
  const isLoss = overallProfit < 0;

  const markupFlash = useFlashOnChange(markupValue);
  const commissionFlash = useFlashOnChange(commissionValue);
  const otherExpensesFlash = useFlashOnChange(otherExpensesTotal);
  const profitFlash = useFlashOnChange(overallProfit);

  return (
    <Card title={t("jobOrderCreate.summaryHeading")}>
      <dl className="space-y-3">
        <SummaryRow label={t("jobOrderCreate.originalTotal")} value={formatLKR(Math.round(originalTotal))} muted />
        <SummaryRow label={t("jobOrderCreate.newTotal")} value={formatLKR(Math.round(newTotal))} />
        {removedValue > 0 && (
          <SummaryRow
            label={t("jobOrderCreate.removedValue")}
            value={`- ${formatLKR(Math.round(removedValue))}`}
            muted
          />
        )}
        <div className="border-t border-border pt-3">
          <SummaryRow
            label={t("jobOrderCreate.markup")}
            value={formatLKR(Math.round(markupValue))}
            flash={markupFlash}
          />
        </div>
        <SummaryRow
          label={t("jobOrderCreate.salesCommission")}
          value={formatLKR(Math.round(commissionValue))}
          flash={commissionFlash}
        />
        <SummaryRow
          label={t("jobOrderCreate.otherExpensesHeading")}
          value={formatLKR(Math.round(otherExpensesTotal))}
          flash={otherExpensesFlash}
        />
      </dl>

      <div
        className={`-mx-4 mt-4 flex items-center justify-between gap-3 border-t border-border px-4 pt-4 transition-colors duration-700 ease-out ${
          profitFlash ? (isLoss ? "bg-red-50" : "bg-green-50") : ""
        }`}
      >
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {isLoss ? t("jobOrderCreate.loss") : t("jobOrderCreate.profit")}
        </p>
        <p className={`text-xl font-bold ${isLoss ? "text-red-600" : "text-green-600"}`}>
          {formatLKR(Math.round(overallProfit))}
        </p>
      </div>
    </Card>
  );
}

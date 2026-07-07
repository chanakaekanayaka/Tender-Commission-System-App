import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

interface JobOrderSummaryCardProps {
  originalTotal: number;
  newTotal: number;
  markupValue: number;
  commissionValue: number;
  otherExpensesTotal: number;
  profit: number;
}

function SummaryRow({
  label,
  value,
  muted = false,
  large = false,
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`text-sm ${muted ? "text-muted" : "text-ink"}`}>{label}</dt>
      <dd className={`font-semibold ${large ? "text-xl" : "text-sm"} ${muted ? "text-muted" : "text-ink"}`}>
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
  profit,
}: JobOrderSummaryCardProps) {
  const { t } = useTranslation();
  const removedValue = originalTotal - newTotal;

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
          <SummaryRow label={t("jobOrderCreate.markup")} value={formatLKR(Math.round(markupValue))} />
        </div>
        <SummaryRow
          label={t("jobOrderCreate.salesCommission")}
          value={`- ${formatLKR(Math.round(commissionValue))}`}
        />
        <SummaryRow
          label={t("jobOrderCreate.otherExpensesHeading")}
          value={`- ${formatLKR(Math.round(otherExpensesTotal))}`}
        />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {t("jobOrderCreate.profit")}
        </p>
        <p className={`text-xl font-bold ${profit < 0 ? "text-red-600" : "text-ink"}`}>
          {formatLKR(Math.round(profit))}
        </p>
      </div>
    </Card>
  );
}

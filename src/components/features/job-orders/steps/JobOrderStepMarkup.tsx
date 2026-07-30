"use client";

import { Card } from "@/components/ui/Card";
import { ZeroToggle } from "@/components/ui/ZeroToggle";
import { AmountPercentInput } from "@/components/features/job-orders/AmountPercentInput";
import { JobOrderContextSummary } from "@/components/features/job-orders/JobOrderContextSummary";
import { JobOrderSummaryCard } from "@/components/features/job-orders/JobOrderSummaryCard";
import { useJobOrderWizard } from "@/components/features/job-orders/JobOrderWizardContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

export function JobOrderStepMarkup() {
  const { t } = useTranslation();
  const {
    role,
    newTotal,
    originalTotal,
    profitBase,
    markupValue,
    markupPercent,
    setMarkupValue,
    setMarkupPercent,
    commissionValue,
    commissionPercent,
    setCommissionValue,
    setCommissionPercent,
    commissionZeroed,
    setCommissionZeroed,
    otherExpensesTotal,
  } = useJobOrderWizard();
  const isAdmin = role === "admin";
  const isLoss = profitBase < 0;
  const commissionDisabled = commissionZeroed || (!isAdmin && isLoss);

  return (
    <>
      <JobOrderContextSummary />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {/* Staff drives the split from Commission instead (their own rate) — Markup is purely an
              Admin concern (the company's own share), so Staff doesn't see this section at all. */}
          {isAdmin && (
            <Card title={t("jobOrderCreate.markupHeading")}>
              <AmountPercentInput
                base={profitBase}
                value={markupValue}
                percent={markupPercent}
                onValueChange={setMarkupValue}
                onPercentChange={setMarkupPercent}
              />
            </Card>
          )}

          <Card
            title={t("jobOrderCreate.commissionHeading")}
            action={
              isAdmin && (
                <ZeroToggle
                  label={t("jobOrderCreate.setToZero")}
                  checked={commissionZeroed}
                  onChange={setCommissionZeroed}
                />
              )
            }
          >
            <AmountPercentInput
              base={profitBase}
              value={commissionValue}
              percent={commissionPercent}
              onValueChange={setCommissionValue}
              onPercentChange={setCommissionPercent}
              disabled={commissionDisabled}
            />
            {!isAdmin && isLoss && (
              <p className="mt-1 text-xs text-red-600">{t("jobOrderCreate.commissionDisabledOnLoss")}</p>
            )}
            {!isAdmin && !isLoss && (
              <p className="mt-1 text-xs text-muted">
                {t("jobOrderCreate.yourCommission")}: {formatLKR(Math.round(commissionValue))}
              </p>
            )}
          </Card>
        </div>

        <JobOrderSummaryCard
          originalTotal={originalTotal}
          newTotal={newTotal}
          markupValue={markupValue}
          commissionValue={commissionValue}
          otherExpensesTotal={otherExpensesTotal}
          overallProfit={profitBase}
        />
      </div>
    </>
  );
}

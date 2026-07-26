"use client";

import { Card } from "@/components/ui/Card";
import { ZeroToggle } from "@/components/ui/ZeroToggle";
import { AmountPercentInput } from "@/components/features/job-orders/AmountPercentInput";
import { JobOrderContextSummary } from "@/components/features/job-orders/JobOrderContextSummary";
import { JobOrderSummaryCard } from "@/components/features/job-orders/JobOrderSummaryCard";
import { useJobOrderWizard } from "@/components/features/job-orders/JobOrderWizardContext";
import { useTranslation } from "@/context/LanguageContext";

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
    profit,
  } = useJobOrderWizard();
  const isAdmin = role === "admin";

  return (
    <>
      <JobOrderContextSummary />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Card title={t("jobOrderCreate.markupHeading")}>
            {/* Staff sees this read-only — they drive the split from Commission instead (their own
                rate), Markup comes back as its complement (see JobOrderWizardContext). */}
            <AmountPercentInput
              base={profitBase}
              value={markupValue}
              percent={markupPercent}
              onValueChange={isAdmin ? setMarkupValue : undefined}
              onPercentChange={isAdmin ? setMarkupPercent : undefined}
              disabled={!isAdmin}
            />
          </Card>

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
              disabled={commissionZeroed}
            />
          </Card>
        </div>

        <JobOrderSummaryCard
          originalTotal={originalTotal}
          newTotal={newTotal}
          markupValue={markupValue}
          commissionValue={commissionValue}
          otherExpensesTotal={otherExpensesTotal}
          profit={profit}
        />
      </div>
    </>
  );
}

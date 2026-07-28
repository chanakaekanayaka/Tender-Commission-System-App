"use client";

import { Card } from "@/components/ui/Card";
import { useJobOrderWizard } from "@/components/features/job-orders/JobOrderWizardContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

/** Quick "which job order am I on" reminder for Steps 2/3 — Step 1's own Procurement selector
 *  already shows this, but once you've scrolled past it into Receipts/Markup there's nothing on
 *  screen tying the numbers back to a specific tender. Mobile-first: stacks to one column, then
 *  three side by side from `sm` up. */
export function JobOrderContextSummary() {
  const { t } = useTranslation();
  const { procurementNo, procuringEntity, newTotal } = useJobOrderWizard();

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("common.procuringEntity")}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-ink">{procuringEntity || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("common.procurementNo")}
          </p>
          <p className="mt-1 text-sm font-medium text-ink">{procurementNo || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("jobOrderCreate.summaryTotal")}
          </p>
          <p className="mt-1 text-sm font-bold text-ink">{formatLKR(Math.round(newTotal))}</p>
        </div>
      </div>
    </Card>
  );
}

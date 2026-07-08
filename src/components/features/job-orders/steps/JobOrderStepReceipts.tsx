"use client";

import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ZeroToggle } from "@/components/ui/ZeroToggle";
import { OtherExpensesSection } from "@/components/features/job-orders/OtherExpensesSection";
import { ReceiptsList } from "@/components/features/job-orders/ReceiptsList";
import { ReceiptsUploadArea } from "@/components/features/job-orders/ReceiptsUploadArea";
import { useJobOrderWizard } from "@/components/features/job-orders/JobOrderWizardContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

export function JobOrderStepReceipts() {
  const { t } = useTranslation();
  const {
    role,
    receipts,
    addReceipts,
    removeReceipt,
    updateReceiptAmount,
    otherExpenses,
    handleAddExpense,
    handleRemoveExpense,
    handleExpenseChange,
    expensesZeroed,
    setExpensesZeroed,
    receiptsTotal,
    manualExpensesTotal,
    otherExpensesTotal,
  } = useJobOrderWizard();
  const isAdmin = role === "admin";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <ReceiptsUploadArea onFilesAdded={addReceipts} />
        <ReceiptsList receipts={receipts} onAmountChange={updateReceiptAmount} onRemove={removeReceipt} />
      </div>

      <Card
        title={t("jobOrderCreate.otherExpensesHeading")}
        action={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <ZeroToggle
                label={t("jobOrderCreate.setToZero")}
                checked={expensesZeroed}
                onChange={setExpensesZeroed}
              />
            )}
            <button
              type="button"
              onClick={handleAddExpense}
              disabled={expensesZeroed}
              className="flex items-center gap-1 text-xs font-medium text-ink underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t("jobOrderCreate.addExpense")}
            </button>
          </div>
        }
      >
        <OtherExpensesSection
          expenses={otherExpenses}
          onRemove={handleRemoveExpense}
          onChange={handleExpenseChange}
          disabled={expensesZeroed}
        />
      </Card>

      <Card title={t("jobOrderCreate.summaryHeading")}>
        <dl className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-muted">{t("jobOrderCreate.receiptsSubtotal")}</dt>
            <dd className="font-medium text-ink">{formatLKR(Math.round(receiptsTotal))}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-muted">{t("jobOrderCreate.manualExpensesSubtotal")}</dt>
            <dd className="font-medium text-ink">{formatLKR(Math.round(manualExpensesTotal))}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">
            {t("jobOrderCreate.subTotal")}
          </p>
          <p className="text-xl font-bold text-ink">{formatLKR(Math.round(otherExpensesTotal))}</p>
        </div>
      </Card>
    </>
  );
}

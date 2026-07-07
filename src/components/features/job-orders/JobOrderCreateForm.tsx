"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ZeroToggle } from "@/components/ui/ZeroToggle";
import { useTranslation } from "@/context/LanguageContext";
import { procurementLineItems, procurementOptions, staffOptions } from "@/lib/mock/jobOrders.mock";
import { calculateLineItemTotals, percentFromValue, valueFromPercent } from "@/lib/utils/pricing";
import type { AmountInputMode, JobOrderLineItem, OtherExpenseItem } from "@/shared/types/job-order.types";
import { AmountPercentInput } from "@/components/features/job-orders/AmountPercentInput";
import { AssignStaffSelect } from "@/components/features/job-orders/AssignStaffSelect";
import { JobOrderLineItemsTable } from "@/components/features/job-orders/JobOrderLineItemsTable";
import { JobOrderSummaryCard } from "@/components/features/job-orders/JobOrderSummaryCard";
import { OtherExpensesSection } from "@/components/features/job-orders/OtherExpensesSection";
import { ProcurementSelector } from "@/components/features/job-orders/ProcurementSelector";

interface JobOrderCreateFormProps {
  role: "admin" | "staff";
}

const sumSubTotals = (items: JobOrderLineItem[]) =>
  items.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice).subTotal, 0);

let expenseSeq = 0;
const nextExpenseId = () => `expense-${++expenseSeq}`;

export function JobOrderCreateForm({ role }: JobOrderCreateFormProps) {
  const { t } = useTranslation();
  const isAdmin = role === "admin";

  const [procurementNo, setProcurementNo] = useState("");
  const [originalItems, setOriginalItems] = useState<JobOrderLineItem[]>([]);
  const [items, setItems] = useState<JobOrderLineItem[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState("");

  // Markup — bidirectional Value ⇄ Percentage. `mode` tracks which side the user
  // last typed into; the other side is always derived from `newTotal` below, so
  // removing a line item re-flows the pinned side (percent stays fixed and the
  // Rs value recomputes, or vice versa) instead of going stale.
  const [markupMode, setMarkupMode] = useState<AmountInputMode>("percentage");
  const [markupPercentInput, setMarkupPercentInput] = useState(0);
  const [markupValueInput, setMarkupValueInput] = useState(0);

  const [commissionMode, setCommissionMode] = useState<AmountInputMode>("percentage");
  const [commissionPercentInput, setCommissionPercentInput] = useState(0);
  const [commissionValueInput, setCommissionValueInput] = useState(0);
  const [commissionZeroed, setCommissionZeroed] = useState(false);

  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>([]);
  const [expensesZeroed, setExpensesZeroed] = useState(false);

  const handleSelectProcurement = (nextProcurementNo: string) => {
    setProcurementNo(nextProcurementNo);
    const lineItems = procurementLineItems[nextProcurementNo] ?? [];
    setOriginalItems(lineItems);
    setItems(lineItems);

    // Fresh procurement = fresh job order — don't carry over calc state from
    // whatever was previously selected.
    setMarkupMode("percentage");
    setMarkupPercentInput(0);
    setMarkupValueInput(0);
    setCommissionMode("percentage");
    setCommissionPercentInput(0);
    setCommissionValueInput(0);
    setCommissionZeroed(false);
    setOtherExpenses([]);
    setExpensesZeroed(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddExpense = () => {
    setOtherExpenses((prev) => [...prev, { id: nextExpenseId(), label: "", amount: 0 }]);
  };

  const handleRemoveExpense = (id: string) => {
    setOtherExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleExpenseChange = (id: string, field: "label" | "amount", value: string) => {
    setOtherExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id
          ? { ...expense, [field]: field === "amount" ? Math.max(0, Number(value) || 0) : value }
          : expense,
      ),
    );
  };

  const originalTotal = sumSubTotals(originalItems);
  const newTotal = sumSubTotals(items);

  const markupValue =
    markupMode === "percentage" ? valueFromPercent(newTotal, markupPercentInput) : markupValueInput;
  const markupPercent =
    markupMode === "percentage" ? markupPercentInput : percentFromValue(newTotal, markupValueInput);

  const commissionValue = commissionZeroed
    ? 0
    : commissionMode === "percentage"
      ? valueFromPercent(newTotal, commissionPercentInput)
      : commissionValueInput;
  const commissionPercent = commissionZeroed
    ? 0
    : commissionMode === "percentage"
      ? commissionPercentInput
      : percentFromValue(newTotal, commissionValueInput);

  const otherExpensesTotal = expensesZeroed
    ? 0
    : otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const profit = markupValue - (commissionValue + otherExpensesTotal);

  return (
    <>
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "lg:grid-cols-[3fr_2fr]" : ""}`}>
        <ProcurementSelector
          procurementNo={procurementNo}
          options={procurementOptions}
          onSelect={handleSelectProcurement}
        />
        {isAdmin && (
          <AssignStaffSelect staffId={assignedStaffId} options={staffOptions} onChange={setAssignedStaffId} />
        )}
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          {t("jobOrderCreate.lineItemsHeading")}
        </p>
        <JobOrderLineItemsTable items={items} onRemove={handleRemoveItem} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Card title={t("jobOrderCreate.markupHeading")}>
            <AmountPercentInput
              base={newTotal}
              value={markupValue}
              percent={markupPercent}
              onValueChange={(v) => {
                setMarkupMode("value");
                setMarkupValueInput(v);
              }}
              onPercentChange={(p) => {
                setMarkupMode("percentage");
                setMarkupPercentInput(p);
              }}
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
              base={newTotal}
              value={commissionValue}
              percent={commissionPercent}
              onValueChange={(v) => {
                setCommissionMode("value");
                setCommissionValueInput(v);
              }}
              onPercentChange={(p) => {
                setCommissionMode("percentage");
                setCommissionPercentInput(p);
              }}
              disabled={commissionZeroed}
            />
          </Card>

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

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
        >
          {t("jobOrderCreate.saveDraft")}
        </button>
        <button
          type="button"
          disabled={!procurementNo}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("jobOrderCreate.createJobOrder")}
        </button>
      </div>
    </>
  );
}

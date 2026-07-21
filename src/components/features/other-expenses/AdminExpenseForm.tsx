"use client";

import { Paperclip } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { SearchableSelectField } from "@/components/ui/SearchableSelectField";
import { SelectField } from "@/components/ui/SelectField";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import { EXPENSE_CATEGORIES } from "@/shared/types/other-expense.types";
import type { AdminExpenseRecord, ExpenseCategory } from "@/shared/types/other-expense.types";

interface AdminExpenseFormProps {
  jobOrderNos: string[];
  onSubmit?: (expense: AdminExpenseRecord) => void;
}

/** Admin's Create Expense form — records a job-order-linked expense, saved as "Pending" until reviewed (see AdminExpenseHistory). */
export function AdminExpenseForm({ jobOrderNos, onSubmit }: AdminExpenseFormProps) {
  const { t } = useTranslation();
  const [jobOrderNo, setJobOrderNo] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>();
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = jobOrderNo !== "" && category !== "" && amount > 0 && description.trim() !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const expense: AdminExpenseRecord = {
      id: crypto.randomUUID(),
      jobOrderNo,
      category,
      description,
      amount,
      date,
      status: "Pending",
      receiptFileName,
    };

    // TODO: POST /api/expenses once that route exists — UI-only mock phase (AGENTS.md).
    console.log("Save expense", expense);
    onSubmit?.(expense);

    setJobOrderNo("");
    setCategory("");
    setAmount(0);
    setDescription("");
    setReceiptFileName(undefined);
    setToast({ message: t("otherExpenses.saved"), variant: "success" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title={t("otherExpenses.createHeading")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelectField
            label={t("otherExpenses.jobOrderNo")}
            value={jobOrderNo}
            options={jobOrderNos.map((no) => ({ value: no, label: no }))}
            onChange={setJobOrderNo}
            placeholder={t("otherExpenses.selectJobOrder")}
          />
          <SelectField
            label={t("otherExpenses.categoryLabel")}
            value={category}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            onChange={(v) => setCategory(v as ExpenseCategory)}
            placeholder={t("otherExpenses.selectCategory")}
          />
          <FormField
            label={t("otherExpenses.amount")}
            value={amount}
            onChange={(v) => setAmount(Math.max(0, Number(v) || 0))}
            type="number"
            min={0}
            suffix="Rs"
          />
          <FormField label={t("otherExpenses.date")} value={date} onChange={setDate} type="date" />

          <div className="sm:col-span-2">
            <FormField label={t("otherExpenses.description")} value={description} onChange={setDescription} />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-sm text-muted">{t("otherExpenses.receipt")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceiptFileName(e.target.files?.[0]?.name)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                <Paperclip className="h-3.5 w-3.5" aria-hidden />
                {t("otherExpenses.chooseReceipt")}
              </button>
              <span className="text-xs text-muted">{receiptFileName ?? t("otherExpenses.noReceiptChosen")}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("otherExpenses.save")}
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </form>
  );
}

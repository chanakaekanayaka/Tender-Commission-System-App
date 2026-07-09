"use client";

import { Paperclip } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import type { OtherExpenseRecord } from "@/shared/types/other-expense.types";

interface OtherExpenseFormProps {
  onSubmit?: (expense: OtherExpenseRecord) => void;
}

/** Records a new Other Expense — "Pending" until picked up by a generated invoice (see StaffInvoiceModule). */
export function OtherExpenseForm({ onSubmit }: OtherExpenseFormProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = description.trim() !== "" && amount > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const expense: OtherExpenseRecord = {
      id: crypto.randomUUID(),
      description,
      amount,
      date,
      status: "Pending",
      receiptFileName,
    };

    // TODO: POST /api/other-expenses once that route exists — UI-only mock phase (AGENTS.md).
    console.log("Save other expense", expense);
    onSubmit?.(expense);

    setDescription("");
    setAmount(0);
    setReceiptFileName(undefined);
    setSavedAt(Date.now());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title={t("otherExpenses.createHeading")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label={t("otherExpenses.description")} value={description} onChange={setDescription} />
          </div>
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
        {savedAt && <span className="text-xs text-muted">{t("otherExpenses.saved")}</span>}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("otherExpenses.save")}
        </button>
      </div>
    </form>
  );
}

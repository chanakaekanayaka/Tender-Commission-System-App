import { Trash2 } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { OtherExpenseItem } from "@/shared/types/job-order.types";

interface OtherExpensesSectionProps {
  expenses: OtherExpenseItem[];
  onRemove: (id: string) => void;
  onChange: (id: string, field: "label" | "amount", value: string) => void;
  /** Admin's "set to 0" override (toggled via a `ZeroToggle` in the parent Card's header). */
  disabled?: boolean;
}

/** Section heading + Add/zero controls live on the wrapping Card, not here, so they aren't shown twice. */
export function OtherExpensesSection({
  expenses,
  onRemove,
  onChange,
  disabled = false,
}: OtherExpensesSectionProps) {
  const { t } = useTranslation();
  const total = disabled ? 0 : expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      {expenses.length === 0 ? (
        <p className="text-sm text-muted">{t("jobOrderCreate.noExpenses")}</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
              <FormField
                label={t("jobOrderCreate.expenseLabel")}
                value={expense.label}
                onChange={(v) => onChange(expense.id, "label", v)}
                placeholder={t("jobOrderCreate.expenseLabelPlaceholder")}
                disabled={disabled}
              />
              <FormField
                label={t("jobOrderCreate.expenseAmount")}
                type="number"
                min={0}
                value={expense.amount}
                onChange={(v) => onChange(expense.id, "amount", v)}
                suffix="Rs"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => onRemove(expense.id)}
                disabled={disabled}
                aria-label={t("jobOrderCreate.removeExpense")}
                className="justify-self-start rounded-none border border-border p-2 text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-ink">
        {t("jobOrderCreate.expensesTotal")}: {formatLKR(Math.round(total))}
      </p>
    </div>
  );
}

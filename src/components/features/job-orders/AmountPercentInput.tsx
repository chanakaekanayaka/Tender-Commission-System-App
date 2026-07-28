import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface AmountPercentInputProps {
  base: number;
  value: number;
  percent: number;
  /** Omitted entirely for a read-only instance (e.g. Sales Commission, which is always derived —
   *  see JobOrderWizardContext) — there's nothing for the user to type into, so no handler exists. */
  onValueChange?: (value: number) => void;
  onPercentChange?: (percent: number) => void;
  /** Non-interactive display — the caller is responsible for what `value`/`percent` show in this
   *  state (e.g. 0 for an explicit "set to zero" override), this only affects editability/styling. */
  disabled?: boolean;
}

/**
 * Bidirectional Value ⇄ Percentage pair, shared by the Markup and Sales Commission sections.
 * Markup is always editable — whichever field the user types into drives the recalculation of the
 * other, always relative to `base` (the profit base: Original Total minus Other Expenses). Sales
 * Commission reuses the same layout purely as a read-only display of its derived value/percent.
 * Section heading lives on the wrapping Card, not here, so it isn't shown twice.
 */
export function AmountPercentInput({
  base,
  value,
  percent,
  onValueChange,
  onPercentChange,
  disabled = false,
}: AmountPercentInputProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t("jobOrderCreate.valueLabel")}
          type="number"
          min={0}
          value={round2(value)}
          onChange={(v) => onValueChange?.(Math.max(0, Number(v) || 0))}
          suffix="Rs"
          disabled={disabled}
        />
        <FormField
          label={t("jobOrderCreate.percentageLabel")}
          type="number"
          min={0}
          step={0.01}
          value={round2(percent)}
          onChange={(v) => onPercentChange?.(Math.max(0, Number(v) || 0))}
          suffix="%"
          disabled={disabled}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("jobOrderCreate.basedOnProfit", { base: formatLKR(Math.round(base)) })}
      </p>
    </div>
  );
}

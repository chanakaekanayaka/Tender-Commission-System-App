import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface AmountPercentInputProps {
  base: number;
  value: number;
  percent: number;
  onValueChange: (value: number) => void;
  onPercentChange: (percent: number) => void;
  /** Admin's "set to 0" override (toggled via a `ZeroToggle` in the parent Card's header). */
  disabled?: boolean;
}

/**
 * Bidirectional Value ⇄ Percentage pair, shared by the Markup and Sales Commission
 * sections. Both fields are always editable — whichever one the user types into
 * drives the recalculation of the other, always relative to `base` (New Total).
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
          value={disabled ? 0 : round2(value)}
          onChange={(v) => onValueChange(Math.max(0, Number(v) || 0))}
          suffix="Rs"
          disabled={disabled}
        />
        <FormField
          label={t("jobOrderCreate.percentageLabel")}
          type="number"
          min={0}
          step={0.01}
          value={disabled ? 0 : round2(percent)}
          onChange={(v) => onPercentChange(Math.max(0, Number(v) || 0))}
          suffix="%"
          disabled={disabled}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("jobOrderCreate.basedOnNewTotal", { base: formatLKR(Math.round(base)) })}
      </p>
    </div>
  );
}

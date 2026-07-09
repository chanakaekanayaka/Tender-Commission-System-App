import type { ReactNode } from "react";

interface ToggleProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Sharp-edged checkbox row for a single on/off setting — the permission-toggle counterpart to ZeroToggle, kept as a bordered row rather than a pill-shaped switch per the no-rounding design rule. */
export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <label
      className={`flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm ${
        disabled ? "cursor-not-allowed bg-card text-muted" : "bg-surface text-ink"
      }`}
    >
      {label}
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded-none border-border"
      />
    </label>
  );
}

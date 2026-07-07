import type { ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: ReactNode;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Reusable labeled select — used for Procurement No and Assign to Staff dropdowns. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: SelectFieldProps) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block w-full rounded-none border border-border bg-surface px-3 py-2 text-ink focus:border-active focus:outline-none ${
          disabled ? "cursor-not-allowed bg-card text-muted" : ""
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

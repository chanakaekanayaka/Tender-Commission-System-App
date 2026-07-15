import type { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  value: string | number;
  onChange?: (value: string) => void;
  type?: "text" | "number" | "date" | "password";
  suffix?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

/** Reusable labeled input — editable counterpart to the read-only metadata `Field` used in tender forms. */
export function FormField({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  disabled = false,
  placeholder,
  min,
  max,
  step,
}: FormFieldProps) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="relative mt-1">
        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange?.(e.target.value)}
          className={`block w-full rounded-none border border-border bg-surface px-3 py-2 text-ink focus:border-active focus:outline-none ${
            suffix ? "pr-10" : ""
          } ${disabled ? "cursor-not-allowed bg-card text-muted" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

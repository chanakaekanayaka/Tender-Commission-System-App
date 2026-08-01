import { Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";

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
  /** Validation message — shown below the input, which also switches to a red border. */
  error?: string;
  /** Renders a multi-line `<textarea>` instead of `<input>` — for fields like Note where typed
   *  content can run long and needs to stay visible instead of scrolling out of a single line. */
  multiline?: boolean;
  rows?: number;
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
  error,
  multiline = false,
  rows = 3,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const fieldClassName = `block w-full rounded-none border bg-surface px-3 py-2 text-ink focus:outline-none ${
    error ? "border-red-600 focus:border-red-600" : "border-border focus:border-active"
  } ${suffix || isPassword ? "pr-10" : ""} ${disabled ? "cursor-not-allowed bg-card text-muted" : ""}`;

  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="relative mt-1">
        {multiline ? (
          <textarea
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            onChange={(e) => onChange?.(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={fieldClassName}
          />
        ) : (
          <input
            type={isPassword && showPassword ? "text" : type}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange?.(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={fieldClassName}
          />
        )}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        ) : (
          suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
              {suffix}
            </span>
          )
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

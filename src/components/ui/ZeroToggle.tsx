interface ZeroToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Admin-only "set to 0" override checkbox — lives in a Card's header action slot. */
export function ZeroToggle({ label, checked, onChange }: ZeroToggleProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded-none border-border"
      />
      {label}
    </label>
  );
}

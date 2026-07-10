"use client";

import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectFieldProps {
  label: ReactNode;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  noMatchesLabel?: string;
}

/**
 * Labeled searchable dropdown — filters `options` as the user types, same
 * `rounded-none border border-border bg-surface` shell as FormField/SelectField.
 * Self-contained ('use client') since the open/query state is inherent to the
 * widget, same as leaf client components like T.tsx.
 */
export function SearchableSelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Search…",
  noMatchesLabel = "No matches",
}: SearchableSelectFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [query, options]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? "";

  return (
    <label className="relative block text-sm">
      <span className="text-muted">{label}</span>
      <div className="relative mt-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="text"
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          placeholder={placeholder}
          className="block w-full rounded-none border border-border bg-surface py-2 pr-3 pl-8 text-ink focus:border-active focus:outline-none"
        />
      </div>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-border bg-card text-sm shadow-sm">
          {filtered.length === 0 && <li className="px-3 py-2 text-muted">{noMatchesLabel}</li>}
          {filtered.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-ink hover:bg-active/5"
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

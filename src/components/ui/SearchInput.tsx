import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Reusable search box — the icon + bordered-input shell shared by every filterable history/active table. */
export function SearchInput({ value, onChange, placeholder, className = "max-w-xs" }: SearchInputProps) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-none border border-border bg-surface py-2 pr-3 pl-8 text-sm text-ink placeholder:text-muted"
      />
    </div>
  );
}

import type { ReactNode } from "react";

export type BadgeTone = "amber" | "blue" | "green" | "red" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  neutral: "border border-border text-muted",
};

interface StatusBadgeProps {
  label: ReactNode;
  tone: BadgeTone;
}

/** Sharp (rounded-none) semantic status pill — reused anywhere a row status needs color-coding. */
export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span className={`inline-block rounded-none px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

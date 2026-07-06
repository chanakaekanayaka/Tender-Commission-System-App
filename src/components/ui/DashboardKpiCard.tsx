import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { KpiCardData } from "@/types/dashboard";

export function DashboardKpiCard({
  label,
  value,
  helperText,
  helperLink,
  showWarningIcon,
  progressPercent,
}: KpiCardData) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>

      {typeof progressPercent === "number" && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-active"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        {showWarningIcon && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        )}
        <span>{helperText}</span>
        {helperLink && (
          <>
            <span aria-hidden>·</span>
            <Link
              href={helperLink.href}
              className="underline underline-offset-2 hover:text-ink"
            >
              {helperLink.label}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

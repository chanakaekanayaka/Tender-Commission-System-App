"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";

interface MonthlyTargetCardProps {
  label: ReactNode;
  targetAmount: number;
  achievedAmount: number;
}

type ProgressTone = "danger" | "warning" | "success";

function getDaysRemainingInMonth(today: Date): number {
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDayOfMonth - today.getDate();
}

// <=1/3 achieved: danger, <=2/3: warning, above: success.
function getProgressTone(progress: number): ProgressTone {
  if (progress <= 1 / 3) return "danger";
  if (progress <= 2 / 3) return "warning";
  return "success";
}

const TONE_TEXT_CLASSES: Record<ProgressTone, string> = {
  danger: "text-red-500",
  warning: "text-yellow-500",
  success: "text-emerald-600",
};

const TONE_BAR_CLASSES: Record<ProgressTone, string> = {
  danger: "bg-red-500",
  warning: "bg-yellow-500",
  success: "bg-emerald-600",
};

/**
 * Monthly Target KPI card — same shell as StatCard, plus a days-remaining
 * countdown and a progress readout whose color tracks how much of the
 * target has been achieved (achievedAmount / targetAmount), not the target
 * amount itself. `achievedAmount` is a plain prop so the caller can swap the
 * mock value for a real fetch later without touching this component.
 */
export function MonthlyTargetCard({ label, targetAmount, achievedAmount }: MonthlyTargetCardProps) {
  const { t } = useTranslation();

  const daysRemaining = useMemo(() => getDaysRemainingInMonth(new Date()), []);
  const progress = targetAmount > 0 ? Math.min(1, Math.max(0, achievedAmount / targetAmount)) : 0;
  const tone = getProgressTone(progress);
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{formatLKR(targetAmount)}</p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-none bg-border">
        <div
          className={`h-full rounded-none ${TONE_BAR_CLASSES[tone]}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="text-muted">{t("dashboard.daysRemaining", { days: daysRemaining })}</span>
        <span className={`font-semibold ${TONE_TEXT_CLASSES[tone]}`}>
          {t("dashboard.percentAchieved", { percent: progressPercent })}
        </span>
      </div>
    </div>
  );
}

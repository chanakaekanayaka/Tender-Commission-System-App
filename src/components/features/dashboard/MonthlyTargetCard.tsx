"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { MonthlyTargetOrderRow } from "@/types/dashboard";

interface MonthlyTargetCardProps {
  label: ReactNode;
  targetAmount: number;
  achievedAmount: number;
  orders: MonthlyTargetOrderRow[];
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
 * amount itself. The whole card is a button — clicking it opens a modal listing the
 * actual Job Orders created this calendar month that make up `achievedAmount`, so the
 * figure is never just a bare number with nothing behind it.
 */
export function MonthlyTargetCard({ label, targetAmount, achievedAmount, orders }: MonthlyTargetCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const daysRemaining = useMemo(() => getDaysRemainingInMonth(new Date()), []);
  const progress = targetAmount > 0 ? Math.min(1, Math.max(0, achievedAmount / targetAmount)) : 0;
  const tone = getProgressTone(progress);
  const progressPercent = Math.round(progress * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-none border border-border bg-card p-4 text-left hover:bg-active/5"
      >
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
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={label} size="lg">
        <p className="mb-4 text-sm text-muted">
          {t("dashboard.monthlyTargetSummary", { achieved: formatLKR(achievedAmount), target: formatLKR(targetAmount) })}
        </p>
        <DataTable
          columns={[
            { id: "jobOrderNo", header: t("dashboard.jobNumber"), cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: t("common.procuringEntity"), cell: (row) => row.procuringEntity },
            {
              id: "total",
              header: t("common.totalValue"),
              cell: (row) => formatLKR(row.total),
            },
            { id: "createdDate", header: t("common.date"), cell: (row) => row.createdDate },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage={t("dashboard.noOrdersThisMonth")}
        />
      </Modal>
    </>
  );
}

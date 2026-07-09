"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatDateISO } from "@/lib/utils/dueDate";
import { formatLKR } from "@/lib/utils/currency";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { openPendingPaymentSummary } from "@/lib/utils/printPendingSummary";
import { readGeneratedPendingJobOrders } from "@/lib/utils/staffPendingJobOrdersStore";
import type { PaymentProcessStage, StaffPendingJobOrder } from "@/shared/types/job-order.types";
import type { TranslationKey } from "@/lib/i18n/locales";

interface StaffPendingJobOrdersProps {
  initialData: StaffPendingJobOrder[];
}

const STAGE_ORDER: PaymentProcessStage[] = ["Submitted", "Pending Admin Approval", "Payment Uploaded"];

const STAGE_LABEL_KEY: Record<PaymentProcessStage, TranslationKey> = {
  Submitted: "staffPendingJobOrders.stageSubmitted",
  "Pending Admin Approval": "staffPendingJobOrders.stagePendingApproval",
  "Payment Uploaded": "staffPendingJobOrders.stagePaymentUploaded",
};

/**
 * Staff's read-only monitoring view of bills still moving through Admin's
 * review/payment pipeline — nothing here is actionable by Staff, it's purely
 * "where does my submitted bill currently stand". `stage` per row drives the
 * View Status timeline; the table's own Status column stays "Payment Pending"
 * for every row, since every row here is, by construction, still pending.
 */
export function StaffPendingJobOrders({ initialData }: StaffPendingJobOrdersProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [statusRowId, setStatusRowId] = useState<string | null>(null);

  // Picks up any rows "Generate Bill" wrote from the Active table (see
  // staffPendingJobOrdersStore.ts) — a one-time read from that external store on
  // mount (localStorage isn't available during SSR, so it can't be the initial
  // state), not a cascading-render loop.
  useEffect(() => {
    const generated = readGeneratedPendingJobOrders();
    if (generated.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount, not a render loop
    setRows((prev) => {
      const existingIds = new Set(prev.map((row) => row.id));
      const newRows = generated.filter((row) => !existingIds.has(row.id));
      return newRows.length > 0 ? [...prev, ...newRows] : prev;
    });
  }, []);

  const totalPending = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const filtered = rows.filter((row) => row.jobOrderNo.toLowerCase().includes(query.trim().toLowerCase()));

  const statusRow = rows.find((row) => row.id === statusRowId) ?? null;

  const handlePrintSummary = (row: StaffPendingJobOrder) => {
    openPendingPaymentSummary({
      companyName: defaultSystemConfig.companyName,
      title: t("staffPendingJobOrders.printSummaryTitle"),
      printedAtLabel: `${t("staffPendingJobOrders.printedAt")}: ${formatDateISO(new Date())}`,
      rows: [
        { label: t("activeJobOrders.jobOrderNo"), value: row.jobOrderNo },
        { label: t("common.procurementNo"), value: row.procurementNo },
        { label: t("staffPendingJobOrders.amount"), value: formatLKR(row.amount) },
        { label: t("staffPendingJobOrders.dateSubmitted"), value: row.dateSubmitted },
        { label: t("staffPendingJobOrders.currentStage"), value: t(STAGE_LABEL_KEY[row.stage]) },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <StatCard label={t("staffPendingJobOrders.totalPending")} value={formatLKR(totalPending)} />

      <div className="rounded-none border border-border bg-card p-4">
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("staffPendingJobOrders.searchPlaceholder")}
          />
        </div>

        <DataTable
          columns={[
            { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            {
              id: "status",
              header: t("common.status"),
              cell: () => <StatusBadge label={t("staffPendingJobOrders.paymentPending")} tone="amber" />,
            },
            { id: "amount", header: t("staffPendingJobOrders.amount"), cell: (row) => formatLKR(row.amount) },
            {
              id: "dateSubmitted",
              header: t("staffPendingJobOrders.dateSubmitted"),
              cell: (row) => row.dateSubmitted,
            },
            {
              id: "actions",
              header: t("common.actions"),
              cell: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusRowId(row.id)}
                    className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
                  >
                    {t("staffPendingJobOrders.viewStatus")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintSummary(row)}
                    className="rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
                  >
                    {t("staffPendingJobOrders.printSummary")}
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
          rowKey={(row) => row.id}
          emptyMessage={
            query ? t("staffPendingJobOrders.noResults", { query }) : t("staffPendingJobOrders.empty")
          }
        />
      </div>

      <Modal
        open={statusRow !== null}
        onClose={() => setStatusRowId(null)}
        title={t("staffPendingJobOrders.statusModalTitle", { jobOrderNo: statusRow?.jobOrderNo ?? "" })}
      >
        {statusRow && (
          <ul className="space-y-4">
            {STAGE_ORDER.map((stage, index) => {
              const currentIndex = STAGE_ORDER.indexOf(statusRow.stage);
              const isCurrent = index === currentIndex;
              const isDone = index < currentIndex;
              return (
                <li key={stage} className="flex items-start gap-3">
                  {isDone || isCurrent ? (
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${isCurrent ? "text-active" : "text-ink"}`}
                      aria-hidden
                    />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                  )}
                  <span className={`text-sm ${isCurrent ? "font-semibold text-ink" : isDone ? "text-ink" : "text-muted"}`}>
                    {t(STAGE_LABEL_KEY[stage])}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}

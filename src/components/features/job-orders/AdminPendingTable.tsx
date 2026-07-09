"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import { calculateDueDate, formatDateISO, isPaymentOverdue } from "@/lib/utils/dueDate";
import { openPaymentReminderLetter } from "@/lib/utils/paymentReminderLetter";
import { jobOrderMetadataByProcurement, procurementOptions } from "@/lib/mock/jobOrders.mock";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";
import { PaymentReminderEmailModal } from "@/components/features/job-orders/PaymentReminderEmailModal";
import type { AdminPendingJobOrder } from "@/shared/types/job-order.types";

interface AdminPendingTableProps {
  initialData: AdminPendingJobOrder[];
}

/**
 * Admin's Pending Job Orders — every row here is, by construction, awaiting
 * payment from the procuring entity (the bill was already generated back on
 * the Active table). "Verify Payment" is the one next action; "Due Date" and
 * the overdue "Due" badge are derived from `defaultSystemConfig.paymentDueDays`
 * (System Configs) rather than stored per row.
 */
export function AdminPendingTable({ initialData }: AdminPendingTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [emailRowId, setEmailRowId] = useState<string | null>(null);

  // Real clock — only the payment-due-days input feeding calculateDueDate is a mocked
  // system-config value, per the task's "dummy date values" requirement.
  const today = useMemo(() => new Date(), []);

  const dueById = useMemo(() => {
    const map = new Map<string, { dueDate: Date; overdue: boolean }>();
    for (const row of rows) {
      const dueDate = calculateDueDate(row.billGeneratedDate, defaultSystemConfig.paymentDueDays);
      map.set(row.id, { dueDate, overdue: isPaymentOverdue(dueDate, today) });
    }
    return map;
  }, [rows, today]);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const haystack = [row.jobOrderNo, row.procurementNo, formatLKR(row.billAmount), row.billGeneratedDate]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  // Mock-only: once payment is verified, the row leaves this list. A real
  // backend would move it into Job Order History on the server side.
  const handleVerifyPayment = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handlePrintLetter = (row: AdminPendingJobOrder) => {
    const entity = procurementOptions.find((option) => option.procurementNo === row.procurementNo);
    const metadata = jobOrderMetadataByProcurement[row.procurementNo];
    const dueDateLabel = formatDateISO(dueById.get(row.id)!.dueDate);

    openPaymentReminderLetter({
      companyName: defaultSystemConfig.companyName,
      accentColor: defaultSystemConfig.themeColor,
      jobOrderNo: row.jobOrderNo,
      todayLabel: formatDateISO(today),
      dateFieldLabel: t("jobOrderPending.letterDate"),
      toFieldLabel: t("jobOrderPending.letterTo"),
      subjectLabel: t("jobOrderPending.letterSubject", { jobOrderNo: row.jobOrderNo }),
      entityName: entity?.procuringEntity ?? row.procurementNo,
      entityAddress: metadata?.address ?? "",
      bodyText: t("jobOrderPending.emailTemplate", {
        jobOrderNo: row.jobOrderNo,
        procurementNo: row.procurementNo,
        billAmount: formatLKR(row.billAmount),
        dueDate: dueDateLabel,
        companyName: defaultSystemConfig.companyName,
      }),
    });
  };

  const emailRow = rows.find((row) => row.id === emailRowId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("jobOrderPending.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "jobOrderNo", header: t("activeJobOrders.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
          {
            id: "billAmount",
            header: t("jobOrderPending.billAmount"),
            cell: (row) => formatLKR(row.billAmount),
          },
          {
            id: "billGeneratedDate",
            header: t("jobOrderPending.billGeneratedDate"),
            cell: (row) => row.billGeneratedDate,
          },
          {
            id: "dueDate",
            header: t("jobOrderPending.dueDate"),
            cell: (row) => formatDateISO(dueById.get(row.id)!.dueDate),
          },
          {
            id: "status",
            header: t("common.status"),
            cell: (row) =>
              dueById.get(row.id)!.overdue ? (
                <StatusBadge label={t("jobOrderPending.due")} tone="red" />
              ) : (
                <StatusBadge label={t("jobOrderPending.paymentPending")} tone="amber" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => {
              const overdue = dueById.get(row.id)!.overdue;
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyPayment(row.id)}
                    className="rounded-none bg-active px-3 py-1.5 text-xs font-medium text-active-ink hover:opacity-90"
                  >
                    {t("jobOrderPending.verifyPayment")}
                  </button>
                  <button
                    type="button"
                    disabled={!overdue}
                    onClick={() => setEmailRowId(row.id)}
                    className="rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card"
                  >
                    {t("jobOrderPending.emailButton")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintLetter(row)}
                    className="rounded-none border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-active/5"
                  >
                    {t("jobOrderPending.printLetterButton")}
                  </button>
                </div>
              );
            },
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={query ? t("jobOrderPending.noResults", { query }) : t("jobOrderPending.empty")}
      />

      {emailRow && (
        <PaymentReminderEmailModal
          jobOrderNo={emailRow.jobOrderNo}
          procurementNo={emailRow.procurementNo}
          billAmount={emailRow.billAmount}
          dueDateLabel={formatDateISO(dueById.get(emailRow.id)!.dueDate)}
          toEmail={jobOrderMetadataByProcurement[emailRow.procurementNo]?.email ?? ""}
          onClose={() => setEmailRowId(null)}
        />
      )}
    </div>
  );
}

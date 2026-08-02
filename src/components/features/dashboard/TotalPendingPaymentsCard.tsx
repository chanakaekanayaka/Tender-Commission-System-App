"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatLKR } from "@/lib/utils/currency";
import { calculateDueDate, formatDateISO, isPaymentOverdue } from "@/lib/utils/dueDate";
import type { TotalPendingPaymentRow } from "@/types/dashboard";

interface TotalPendingPaymentsCardProps {
  value: string;
  helperText: string;
  orders: TotalPendingPaymentRow[];
  paymentDueDays: number;
}

/** Same shell as DashboardKpiCard, but the whole card is a button — clicking it opens a modal
 *  listing the actual Job Orders still awaiting payment, each with the same Due Date/overdue
 *  status AdminPendingTable itself computes (calculateDueDate/isPaymentOverdue), so the total is
 *  never just a bare number with nothing behind it. Company Dashboard doesn't use the i18n system
 *  elsewhere, so this stays plain English strings to match. */
export function TotalPendingPaymentsCard({ value, helperText, orders, paymentDueDays }: TotalPendingPaymentsCardProps) {
  const [open, setOpen] = useState(false);
  // Same "today, at day granularity" the row-level overdue check needs — computed once per open
  // session rather than per row.
  const today = useMemo(() => new Date(), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-none border border-border bg-card p-4 text-left hover:bg-active/5"
      >
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Total Pending Payments</p>
        <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        <p className="mt-2 text-sm text-muted underline underline-offset-2">{helperText}</p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Total Pending Payments" size="lg">
        <DataTable
          columns={[
            { id: "jobOrderNo", header: "Job Order No", cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: "Procurement No", cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: "Procuring Entity", cell: (row) => row.procuringEntity },
            { id: "billAmount", header: "Bill Amount", cell: (row) => formatLKR(row.billAmount) },
            { id: "billGeneratedDate", header: "Bill Generated", cell: (row) => row.billGeneratedDate },
            {
              id: "dueDate",
              header: "Due Date",
              cell: (row) => formatDateISO(calculateDueDate(row.billGeneratedDate, paymentDueDays)),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) =>
                isPaymentOverdue(calculateDueDate(row.billGeneratedDate, paymentDueDays), today) ? (
                  <StatusBadge label="Overdue" tone="red" />
                ) : (
                  <StatusBadge label="On Track" tone="green" />
                ),
            },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage="No pending payments."
        />
      </Modal>
    </>
  );
}

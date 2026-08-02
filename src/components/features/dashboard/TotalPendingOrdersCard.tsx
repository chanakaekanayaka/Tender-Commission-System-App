"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatLKR } from "@/lib/utils/currency";
import { calculateDueDate, formatDateISO, isPaymentOverdue } from "@/lib/utils/dueDate";
import type { TotalPendingOrderRow } from "@/types/dashboard";

interface TotalPendingOrdersCardProps {
  orders: TotalPendingOrderRow[];
  overdueCount: number;
  paymentDueDays: number;
}

/**
 * Same shell as DashboardKpiCard, plus two independent actions: clicking the value opens a modal
 * listing the actual Job Orders still open (Active + Pending, i.e. not yet in History), and "view
 * active" is a real navigation link to Job Order Active — kept as its own `<Link>` rather than
 * nested inside the modal-opening button, since a button can't contain another interactive
 * element. Company Dashboard doesn't use the i18n system elsewhere, so this stays plain English
 * strings to match.
 */
export function TotalPendingOrdersCard({ orders, overdueCount, paymentDueDays }: TotalPendingOrdersCardProps) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left hover:opacity-80">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Total Pending Orders</p>
        <p className="mt-2 text-2xl font-bold text-ink">{orders.length}</p>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {overdueCount > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden />}
        <span>{overdueCount} overdue</span>
        <span aria-hidden>·</span>
        <Link href="/admin/job-orders/active" className="underline underline-offset-2 hover:text-ink">
          view active
        </Link>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Total Pending Orders" size="lg">
        <DataTable
          columns={[
            { id: "jobOrderNo", header: "Job Order No", cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: "Procurement No", cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: "Procuring Entity", cell: (row) => row.procuringEntity },
            { id: "total", header: "Total Value", cell: (row) => formatLKR(row.total) },
            {
              id: "status",
              header: "Status",
              cell: (row) =>
                row.status === "Active" ? (
                  <StatusBadge label="Active" tone="blue" />
                ) : (
                  <StatusBadge label="Pending" tone="amber" />
                ),
            },
            {
              id: "dueStatus",
              header: "Due Status",
              cell: (row) => {
                if (!row.billGeneratedDate) return <span className="text-xs text-muted">—</span>;
                const dueDate = calculateDueDate(row.billGeneratedDate, paymentDueDays);
                return isPaymentOverdue(dueDate, today) ? (
                  <StatusBadge label={`Overdue (${formatDateISO(dueDate)})`} tone="red" />
                ) : (
                  <StatusBadge label={`Due ${formatDateISO(dueDate)}`} tone="green" />
                );
              },
            },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage="No pending orders."
        />
      </Modal>
    </div>
  );
}

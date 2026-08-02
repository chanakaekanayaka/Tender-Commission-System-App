"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatLKR } from "@/lib/utils/currency";
import type { MonthlySalesTargetOrderRow } from "@/types/dashboard";

interface MonthlySalesTargetCardProps {
  value: string;
  helperText: string;
  progressPercent: number;
  orders: MonthlySalesTargetOrderRow[];
}

/** Same shell as DashboardKpiCard, but the whole card is a button — clicking it opens a modal
 *  listing the actual Job Orders created this calendar month that make up the achieved figure, so
 *  it's never just a bare number with nothing behind it. Company Dashboard doesn't use the i18n
 *  system elsewhere, so this stays plain English strings to match. */
export function MonthlySalesTargetCard({ value, helperText, progressPercent, orders }: MonthlySalesTargetCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-none border border-border bg-card p-4 text-left hover:bg-active/5"
      >
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Monthly Sales Target</p>
        <p className="mt-2 text-2xl font-bold text-ink">{value}</p>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-none bg-border">
          <div
            className="h-full rounded-none bg-active"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-muted">{helperText}</p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Monthly Sales Target" size="lg">
        <DataTable
          columns={[
            { id: "jobOrderNo", header: "Job Order No", cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: "Procurement No", cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: "Procuring Entity", cell: (row) => row.procuringEntity },
            { id: "staffName", header: "Staff", cell: (row) => row.staffName },
            { id: "total", header: "Total Value", cell: (row) => formatLKR(row.total) },
            { id: "createdDate", header: "Created Date", cell: (row) => row.createdDate },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage="No job orders created this month yet."
        />
      </Modal>
    </>
  );
}

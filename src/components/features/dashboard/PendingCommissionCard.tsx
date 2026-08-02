"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { PendingCommissionRow } from "@/types/dashboard";

interface PendingCommissionCardProps {
  orders: PendingCommissionRow[];
}

/** Same shell as StatCard, but the whole card is a button — clicking it opens a modal listing the
 *  actual Job Orders whose commission is still pending, so the total is never just a bare number
 *  with nothing behind it. */
export function PendingCommissionCard({ orders }: PendingCommissionCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const total = orders.reduce((sum, order) => sum + order.commissionValue, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-none border border-border bg-card p-4 text-left hover:bg-active/5"
      >
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t("dashboard.pendingCommission")}
        </p>
        <p className="mt-2 text-2xl font-bold text-ink">{formatLKR(total)}</p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("dashboard.pendingCommission")} size="lg">
        <DataTable
          columns={[
            { id: "jobOrderNo", header: t("dashboard.jobNumber"), cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: t("common.procuringEntity"), cell: (row) => row.procuringEntity },
            {
              id: "commissionValue",
              header: t("dashboard.commissionValue"),
              cell: (row) => formatLKR(row.commissionValue),
            },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage={t("dashboard.noPendingCommission")}
        />
      </Modal>
    </>
  );
}

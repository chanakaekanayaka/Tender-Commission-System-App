"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { OrderToCompleteRow } from "@/types/dashboard";

interface OrdersToCompleteCardProps {
  orders: OrderToCompleteRow[];
}

/** Same shell as StatCard, but the whole card is a button — clicking it opens a modal listing the
 *  actual Job Orders in this Staff member's own Job Orders > Pending tab, so the count is never
 *  just a bare number with nothing behind it. */
export function OrdersToCompleteCard({ orders }: OrdersToCompleteCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-none border border-border bg-card p-4 text-left hover:bg-active/5"
      >
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t("dashboard.ordersToComplete")}
        </p>
        <p className="mt-2 text-2xl font-bold text-ink">{orders.length}</p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("dashboard.ordersToComplete")} size="lg">
        <DataTable
          columns={[
            { id: "jobOrderNo", header: t("dashboard.jobNumber"), cell: (row) => row.jobOrderNo },
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            { id: "procuringEntity", header: t("common.procuringEntity"), cell: (row) => row.procuringEntity },
            { id: "total", header: t("common.totalValue"), cell: (row) => formatLKR(row.total) },
          ]}
          data={orders}
          rowKey={(row) => row.id}
          emptyMessage={t("dashboard.noOrdersToComplete")}
        />
      </Modal>
    </>
  );
}

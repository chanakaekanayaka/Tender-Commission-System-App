"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { ThisMonthBidRow } from "@/types/dashboard";

interface ThisMonthBiddingCardProps {
  bids: ThisMonthBidRow[];
}

/** Same shell as StatCard, but the whole card is a button — clicking it opens a modal listing the
 *  actual Price Schedules ("bids") completed this calendar month, so the count is never just a
 *  bare number with nothing behind it. The monthly trend itself lives directly on the dashboard
 *  (see BiddingTrendChart), not behind this popup. */
export function ThisMonthBiddingCard({ bids }: ThisMonthBiddingCardProps) {
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
          {t("dashboard.thisMonthBidding")}
        </p>
        <p className="mt-2 text-2xl font-bold text-ink">{bids.length}</p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("dashboard.thisMonthBidding")} size="lg">
        <DataTable
          columns={[
            { id: "procurementNo", header: t("common.procurementNo"), cell: (row) => row.procurementNo },
            {
              id: "procurementTitle",
              header: t("metadataForm.procurementTitle"),
              cell: (row) => row.procurementTitle,
            },
            { id: "procuringEntity", header: t("common.procuringEntity"), cell: (row) => row.procuringEntity },
            { id: "totalValue", header: t("common.totalValue"), cell: (row) => formatLKR(row.totalValue) },
            { id: "createdDate", header: t("common.date"), cell: (row) => row.createdDate },
          ]}
          data={bids}
          rowKey={(row) => row.id}
          emptyMessage={t("dashboard.noBidsThisMonth")}
        />
      </Modal>
    </>
  );
}

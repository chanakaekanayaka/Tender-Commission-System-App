"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { AdminCommissionHistoryRecord } from "@/shared/types/commission.types";

interface AdminCommissionHistoryProps {
  data: AdminCommissionHistoryRecord[];
}

/**
 * Admin's Commission History — read-only record of already-paid staff
 * commissions. Client-only because of the search box state, same split as
 * JobOrderHistoryTable; no row actions here.
 */
export function AdminCommissionHistory({ data }: AdminCommissionHistoryProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.staffName, row.jobOrderNo].join(" ").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("commissions.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "staffName", header: t("commissions.staffName"), cell: (row) => row.staffName },
          { id: "jobOrderNo", header: t("commissions.jobOrderNo"), cell: (row) => row.jobOrderNo },
          { id: "profit", header: t("commissions.profit"), cell: (row) => formatLKR(row.profit) },
          {
            id: "commissionPaid",
            header: t("commissions.commissionPaid"),
            cell: (row) => formatLKR(row.commissionPaid),
          },
          { id: "paymentDate", header: t("commissions.paymentDate"), cell: (row) => row.paymentDate },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("commissions.paidStatus")} tone="green" />,
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("commissions.noHistory")}
      />
    </div>
  );
}

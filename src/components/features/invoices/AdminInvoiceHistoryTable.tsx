"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceDetailModal } from "@/components/features/invoices/InvoiceDetailModal";
import { useTranslation } from "@/context/LanguageContext";
import { useTableQueryState } from "@/lib/hooks/useTableQueryState";
import { formatLKR } from "@/lib/utils/currency";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { InvoiceRequest } from "@/shared/types/invoice.types";

interface AdminInvoiceHistoryTableProps {
  data: InvoiceRequest[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

/** Every Paid invoice across every Staff member, real data. */
export function AdminInvoiceHistoryTable({ data, search, page, totalPages, total }: AdminInvoiceHistoryTableProps) {
  const { t } = useTranslation();
  const { search: searchValue, page: currentPage, setSearch, setPage } = useTableQueryState({ search, page });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingInvoice = data.find((invoice) => invoice.id === viewingId) ?? null;

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={searchValue} onChange={setSearch} placeholder={t("invoices.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "invoiceNo", header: t("invoices.invoiceNo"), cell: (row) => row.invoiceNo },
          { id: "submittedBy", header: t("invoices.submittedBy"), cell: (row) => row.submittedBy },
          { id: "total", header: t("invoices.total"), cell: (row) => formatLKR(row.total) },
          {
            id: "status",
            header: t("common.status"),
            cell: () => <StatusBadge label={t("invoices.paid")} tone="green" />,
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <button
                type="button"
                onClick={() => setViewingId(row.id)}
                className="text-xs font-medium text-ink underline"
              >
                {t("common.view")}
              </button>
            ),
          },
        ]}
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={t("invoices.noHistory")}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} total={total} limit={DEFAULT_PAGE_SIZE} />

      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingId(null)} />
    </div>
  );
}

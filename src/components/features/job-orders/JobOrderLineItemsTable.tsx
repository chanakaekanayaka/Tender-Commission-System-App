import { Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { useTranslation } from "@/context/LanguageContext";
import { formatAmount } from "@/lib/utils/currency";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import type { JobOrderLineItem } from "@/shared/types/job-order.types";

interface JobOrderLineItemsTableProps {
  items: JobOrderLineItem[];
  onRemove: (id: string) => void;
}

/** Line items for the selected procurement — reuses the generic `DataTable` shell, adding a per-row Remove action. */
export function JobOrderLineItemsTable({ items, onRemove }: JobOrderLineItemsTableProps) {
  const { t } = useTranslation();

  return (
    <DataTable
      columns={[
        { id: "item", header: t("lineItems.itemDescription"), cell: (row) => row.item },
        { id: "qty", header: t("lineItems.qty"), cell: (row) => row.qty },
        {
          id: "unitPrice",
          header: t("lineItems.unitPrice"),
          cell: (row) => formatAmount(row.unitPrice),
        },
        {
          id: "vat",
          header: t("lineItems.vat"),
          cell: (row) => formatAmount(calculateLineItemTotals(row.qty, row.unitPrice).vat),
        },
        {
          id: "subTotal",
          header: t("lineItems.subTotal"),
          cell: (row) => formatAmount(calculateLineItemTotals(row.qty, row.unitPrice).subTotal),
        },
        {
          id: "remove",
          header: t("common.actions"),
          cell: (row) => (
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              aria-label={t("jobOrderCreate.removeItem")}
              className="text-muted hover:text-ink"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ),
        },
      ]}
      data={items}
      rowKey={(row) => row.id}
      emptyMessage={t("jobOrderCreate.noItemsSelected")}
    />
  );
}

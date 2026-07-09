import { T } from "@/components/features/i18n/T";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { otherExpenses } from "@/lib/mock/otherExpenses.mock";
import { formatLKR } from "@/lib/utils/currency";

export default function StaffExpenseHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.historyHeading" />
      </h1>

      <DataTable
        data={otherExpenses}
        rowKey={(row) => row.id}
        emptyMessage={<T k="otherExpenses.noResults" />}
        columns={[
          { id: "description", header: <T k="otherExpenses.description" />, cell: (row) => row.description },
          { id: "date", header: <T k="otherExpenses.date" />, cell: (row) => row.date },
          { id: "amount", header: <T k="otherExpenses.amount" />, cell: (row) => formatLKR(row.amount) },
          {
            id: "status",
            header: <T k="common.status" />,
            cell: (row) => (
              <StatusBadge
                label={row.status === "Invoiced" ? <T k="otherExpenses.invoiced" /> : <T k="otherExpenses.pending" />}
                tone={row.status === "Invoiced" ? "green" : "amber"}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

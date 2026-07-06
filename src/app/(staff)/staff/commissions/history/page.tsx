import { T } from "@/components/features/i18n/T";
import { DataTable } from "@/components/ui/DataTable";
import { commissionHistory } from "@/lib/mock/commissions.mock";
import { formatLKR } from "@/lib/utils/currency";
import type { CommissionHistoryRecord } from "@/shared/types/commission.types";

export default function CommissionHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.historyHeading" />
      </h1>

      <DataTable<CommissionHistoryRecord>
        data={commissionHistory}
        rowKey={(row) => row.id}
        emptyMessage={<T k="commissions.noHistory" />}
        columns={[
          { id: "jobOrderNo", header: <T k="commissions.jobOrderNo" />, cell: (row) => row.jobOrderNo },
          { id: "amount", header: <T k="commissions.amount" />, cell: (row) => formatLKR(row.amount) },
          {
            id: "paymentRefNo",
            header: <T k="commissions.paymentRefNo" />,
            cell: (row) => row.paymentRefNo,
          },
        ]}
      />
    </div>
  );
}

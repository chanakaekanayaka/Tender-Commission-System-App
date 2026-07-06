import { T } from "@/components/features/i18n/T";
import { DataTable } from "@/components/ui/DataTable";
import { pendingCommissions } from "@/lib/mock/commissions.mock";
import { formatLKR } from "@/lib/utils/currency";
import type { PendingCommission } from "@/shared/types/commission.types";

export default function CommissionPendingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <DataTable<PendingCommission>
        data={pendingCommissions}
        rowKey={(row) => row.id}
        emptyMessage={<T k="commissions.noPending" />}
        columns={[
          { id: "jobOrderNo", header: <T k="commissions.jobOrderNo" />, cell: (row) => row.jobOrderNo },
          { id: "amount", header: <T k="commissions.amount" />, cell: (row) => formatLKR(row.amount) },
        ]}
      />
    </div>
  );
}

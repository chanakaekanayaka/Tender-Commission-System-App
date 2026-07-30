import { T } from "@/components/features/i18n/T";
import { DataTable } from "@/components/ui/DataTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { formatLKR } from "@/lib/utils/currency";
import type { CommissionHistoryRecord } from "@/shared/types/commission.types";

export default async function CommissionHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await JobOrderModel.find({
    commissionPaidAt: { $ne: null },
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ commissionPaidAt: -1 });

  const data: CommissionHistoryRecord[] = records.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    amount: record.commissionValue,
    paymentDate: record.commissionPaidAt!.toISOString().slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.historyHeading" />
      </h1>

      <DataTable<CommissionHistoryRecord>
        data={data}
        rowKey={(row) => row.id}
        emptyMessage={<T k="commissions.noHistory" />}
        columns={[
          { id: "jobOrderNo", header: <T k="commissions.jobOrderNo" />, cell: (row) => row.jobOrderNo },
          { id: "amount", header: <T k="commissions.amount" />, cell: (row) => formatLKR(row.amount) },
          {
            id: "paymentDate",
            header: <T k="commissions.paymentDate" />,
            cell: (row) => row.paymentDate,
          },
        ]}
      />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { DataTable } from "@/components/ui/DataTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { formatLKR } from "@/lib/utils/currency";
import type { PendingCommission } from "@/shared/types/commission.types";

export default async function CommissionPendingPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3. Same gate as Admin's own
  // Commissions Pending: bill verified, commission not yet paid or rejected, independent of
  // whether the procuring entity has paid the company yet.
  const records = await JobOrderModel.find({
    billVerifiedAt: { $ne: null },
    commissionPaidAt: null,
    commissionRejectedAt: null,
    invoiceId: null,
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ billVerifiedAt: -1 });

  const data: PendingCommission[] = records.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    amount: record.commissionValue,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <DataTable<PendingCommission>
        data={data}
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

import { T } from "@/components/features/i18n/T";
import { AdminPendingCommissions } from "@/components/features/commissions/AdminPendingCommissions";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getProfitBase } from "@/lib/utils/jobOrderExpenses";
import { percentFromValue } from "@/lib/utils/pricing";
import type { AdminPendingCommission } from "@/shared/types/commission.types";

export default async function AdminCommissionsPendingPage() {
  await connectDB();
  // Every job order whose bill has been verified but whose commission hasn't been paid or
  // rejected yet — deliberately independent of paymentVerifiedAt, since Staff can be paid their
  // commission before the procuring entity has paid the company.
  const [records, systemConfig] = await Promise.all([
    JobOrderModel.find({ billVerifiedAt: { $ne: null }, commissionPaidAt: null, commissionRejectedAt: null }).sort({
      billVerifiedAt: -1,
    }),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const staffIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: staffIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const data: AdminPendingCommission[] = records.map((record) => {
    const profit = getProfitBase(record, vatRate);
    return {
      id: record._id.toString(),
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
      jobOrderNo: record.jobOrderNo,
      profit,
      commissionRate: Math.round(percentFromValue(profit, record.commissionValue)),
      calculatedCommission: record.commissionValue,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <AdminPendingCommissions data={data} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { AdminCommissionHistory } from "@/components/features/commissions/AdminCommissionHistory";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getProfitBase } from "@/lib/utils/jobOrderExpenses";
import type { AdminCommissionHistoryRecord } from "@/shared/types/commission.types";

export default async function AdminCommissionHistoryPage() {
  await connectDB();
  const [records, systemConfig] = await Promise.all([
    JobOrderModel.find({ commissionPaidAt: { $ne: null } }).sort({ commissionPaidAt: -1 }),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const staffIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: staffIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const data: AdminCommissionHistoryRecord[] = records.map((record) => ({
    id: record._id.toString(),
    staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
    jobOrderNo: record.jobOrderNo,
    profit: getProfitBase(record, vatRate),
    commissionPaid: record.commissionValue,
    paymentDate: record.commissionPaidAt!.toISOString().slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.historyHeading" />
      </h1>

      <AdminCommissionHistory data={data} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { JobOrderHistoryTable } from "@/components/features/job-orders/JobOrderHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { getExpensesAmount } from "@/lib/utils/jobOrderExpenses";
import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

export default async function StaffJobOrderHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees their own records plus any Admin created and assigned to them
  // (AI_INSTRUCTIONS.md §3). A job order is done for good once payment has been verified — that's
  // the one signal that moves it out of Pending and into History.
  const [records, systemConfig] = await Promise.all([
    JobOrderModel.find({
      paymentVerifiedAt: { $ne: null },
      ...(user ? { $or: [{ createdBy: user._id }, { assignedStaffId: user._id.toString() }] } : {}),
    }).sort({ paymentVerifiedAt: -1 }),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const data: JobOrderHistoryRecord[] = records.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    completionDate: record.paymentVerifiedAt!.toISOString().slice(0, 10),
    originalTotal: record.originalLineItems.reduce(
      (sum: number, row: JobOrderLineItemSubdoc) =>
        sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal,
      0,
    ),
    // Same "what actually went to Staff" figure Active/Pending use — not the entity's bill amount.
    finalValue: getExpensesAmount(record),
    // Staff sees their own profit share (commission), not the company's.
    profit: record.commissionValue,
    isAdminAssigned: Boolean(user) && record.createdBy.toString() !== user!._id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderHistory.heading" />
        </h1>
      </div>

      <JobOrderHistoryTable data={data} />
    </div>
  );
}

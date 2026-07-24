import { T } from "@/components/features/i18n/T";
import { JobOrderHistoryTable } from "@/components/features/job-orders/JobOrderHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

export default async function AdminJobOrderHistoryPage() {
  await connectDB();
  // A job order is done for good once payment has been verified — that's the one signal that
  // moves it out of Pending and into History (see verify-payment route).
  const records = await JobOrderModel.find({ paymentVerifiedAt: { $ne: null } }).sort({
    paymentVerifiedAt: -1,
  });

  const data: JobOrderHistoryRecord[] = records.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    completionDate: record.paymentVerifiedAt!.toISOString().slice(0, 10),
    originalTotal: record.originalLineItems.reduce(
      (sum: number, row: JobOrderLineItemSubdoc) => sum + calculateLineItemTotals(row.qty, row.unitPrice).subTotal,
      0,
    ),
    finalValue: record.billAmount ?? 0,
    profit: record.profit ?? 0,
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

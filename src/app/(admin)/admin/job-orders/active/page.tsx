import { T } from "@/components/features/i18n/T";
import { AdminActiveTable } from "@/components/features/job-orders/AdminActiveTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { AdminActiveJobOrder } from "@/shared/types/job-order.types";

export default async function AdminActiveJobOrdersPage() {
  await connectDB();
  const records = await JobOrderModel.find().sort({ createdAt: -1 });

  // No "billed" state exists on the model yet, so every Job Order stays in Active — Generate Bill
  // just attaches a document here, it doesn't move the row anywhere else (yet).
  const data: AdminActiveJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      completedStep: record.completedStep,
      documentName: record.billDocument?.fileName,
      documentUrl: record.billDocument ? await getSignedImageUrl(record.billDocument.s3Key) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="activeJobOrders.heading" />
        </h1>
      </div>

      <AdminActiveTable initialData={data} />
    </div>
  );
}

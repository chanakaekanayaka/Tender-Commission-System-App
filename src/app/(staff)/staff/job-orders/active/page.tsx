import { T } from "@/components/features/i18n/T";
import { ActiveJobOrdersTable } from "@/components/features/job-orders/ActiveJobOrdersTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { ActiveJobOrder } from "@/shared/types/job-order.types";

export default async function StaffActiveJobOrdersPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await JobOrderModel.find(user ? { createdBy: user._id } : {}).sort({ createdAt: -1 });

  // No "billed" state exists on the model yet, so every Job Order stays in Active — Generate Bill
  // just attaches a document here, it doesn't move the row anywhere else (yet).
  const data: ActiveJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      completedStep: record.completedStep,
      status: record.status,
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

      <ActiveJobOrdersTable initialData={data} />
    </div>
  );
}

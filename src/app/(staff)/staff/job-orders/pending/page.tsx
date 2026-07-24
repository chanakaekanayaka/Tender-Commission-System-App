import { T } from "@/components/features/i18n/T";
import { StaffPendingJobOrders } from "@/components/features/job-orders/StaffPendingJobOrders";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

export default async function StaffPendingJobOrdersPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await JobOrderModel.find({
    billDocument: { $ne: null },
    paymentVerifiedAt: null,
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ "billDocument.generatedAt": -1 });

  const data: StaffPendingJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      amount: record.billAmount ?? 0,
      dateSubmitted: record.billDocument!.generatedAt.toISOString().slice(0, 10),
      paymentProofName: record.paymentProof?.fileName,
      paymentProofType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="staffPendingJobOrders.heading" />
        </h1>
      </div>

      <StaffPendingJobOrders initialData={data} />
    </div>
  );
}

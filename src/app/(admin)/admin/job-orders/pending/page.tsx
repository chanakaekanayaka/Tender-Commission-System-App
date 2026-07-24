import { T } from "@/components/features/i18n/T";
import { AdminPendingTable } from "@/components/features/job-orders/AdminPendingTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { AdminPendingJobOrder } from "@/shared/types/job-order.types";

export default async function AdminPendingJobOrdersPage() {
  await connectDB();
  const [records, systemConfig] = await Promise.all([
    JobOrderModel.find({ billDocument: { $ne: null }, paymentVerifiedAt: null }).sort({
      "billDocument.generatedAt": -1,
    }),
    getOrCreateSystemConfig(),
  ]);

  const data: AdminPendingJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      procuringEntity: record.procuringEntity,
      billAmount: record.billAmount ?? 0,
      billGeneratedDate: record.billDocument!.generatedAt.toISOString().slice(0, 10),
      entityAddress: record.metadata.address,
      entityEmail: record.metadata.email,
      paymentProofName: record.paymentProof?.fileName,
      paymentProofType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderPending.heading" />
        </h1>
      </div>

      <AdminPendingTable initialData={data} paymentDueDays={systemConfig.paymentDueDays} />
    </div>
  );
}

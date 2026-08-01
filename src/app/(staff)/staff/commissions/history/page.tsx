import { T } from "@/components/features/i18n/T";
import { StaffCommissionHistory } from "@/components/features/commissions/StaffCommissionHistory";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel } from "@/lib/db/models/Invoice.model";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateTime } from "@/lib/utils/date";
import type { CommissionHistoryRecord } from "@/shared/types/commission.types";

export default async function CommissionHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3. Staff confirming the receipt (not
  // merely Admin paying) is what actually moves a commission into History — see
  // confirm-commission-payment. Bundling into an Invoice and Admin paying that invoice sets these
  // same fields too (see PATCH /api/invoices/[id]/pay), so both paths land here.
  const records = await JobOrderModel.find({
    commissionPaymentConfirmedAt: { $ne: null },
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ commissionPaymentConfirmedAt: -1 });

  const invoiceIds = [...new Set(records.filter((record) => record.invoiceId).map((record) => record.invoiceId!.toString()))];
  const invoices = await InvoiceModel.find({ _id: { $in: invoiceIds } });
  const invoiceNoById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice.invoiceNo]));

  const data: CommissionHistoryRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      amount: record.commissionValue,
      uploadedAt: formatDateTime(record.commissionPaymentProof!.uploadedAt),
      receiptFileName: record.commissionPaymentProof!.fileName,
      receiptFileType: record.commissionPaymentProof!.fileType,
      receiptUrl: await getSignedImageUrl(record.commissionPaymentProof!.s3Key),
      invoiceNo: record.invoiceId ? invoiceNoById.get(record.invoiceId.toString()) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.historyHeading" />
      </h1>

      <StaffCommissionHistory data={data} />
    </div>
  );
}

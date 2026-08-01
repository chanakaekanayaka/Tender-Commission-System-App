import { T } from "@/components/features/i18n/T";
import { StaffExpenseHistoryTable } from "@/components/features/other-expenses/StaffExpenseHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel } from "@/lib/db/models/Invoice.model";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateOnly, formatDateTime } from "@/lib/utils/date";
import type { StaffExpenseHistoryRecord } from "@/shared/types/other-expense.types";

export default async function StaffExpenseHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await OtherExpenseModel.find({
    status: { $ne: "Pending" },
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ reviewedAt: -1 });

  const invoiceIds = [...new Set(records.filter((record) => record.invoiceId).map((record) => record.invoiceId!.toString()))];
  const invoices = await InvoiceModel.find({ _id: { $in: invoiceIds } });
  const invoiceNoById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice.invoiceNo]));

  const data: StaffExpenseHistoryRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      description: record.description,
      amount: record.amount,
      date: record.date,
      status: record.status as "Approved" | "Rejected",
      receiptFileName: record.receipt?.fileName,
      receiptFileType: record.receipt?.fileType,
      receiptUrl: record.receipt ? await getSignedImageUrl(record.receipt.s3Key) : undefined,
      reviewedDate: formatDateOnly(record.reviewedAt!),
      // Only Approved rows ever get a payment receipt — Rejected ones never had one paid out.
      paymentProofFileName: record.paymentProof?.fileName,
      paymentProofFileType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
      paymentUploadedAt: record.paymentProof ? formatDateTime(record.paymentProof.uploadedAt) : undefined,
      invoiceNo: record.invoiceId ? invoiceNoById.get(record.invoiceId.toString()) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.historyHeading" />
      </h1>

      <StaffExpenseHistoryTable data={data} />
    </div>
  );
}

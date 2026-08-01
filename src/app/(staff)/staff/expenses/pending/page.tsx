import { T } from "@/components/features/i18n/T";
import { StaffExpensePendingTable } from "@/components/features/other-expenses/StaffExpensePendingTable";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateTime } from "@/lib/utils/date";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

export default async function StaffExpensePendingPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3. Bundled-into-an-invoice ones are
  // excluded — see invoiceId (they're resolved together when that invoice is paid instead). Covers
  // two stages in one table (see StaffExpensePendingRecord's own doc comment): status stays
  // "Pending" through both, since it's Staff's own confirmation that flips it to "Approved".
  const records = await OtherExpenseModel.find({
    status: "Pending",
    invoiceId: null,
    ...(user ? { createdBy: user._id } : {}),
  }).sort({ createdAt: -1 });

  const data: StaffExpensePendingRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      description: record.description,
      amount: record.amount,
      date: record.date,
      receiptFileName: record.receipt?.fileName,
      receiptFileType: record.receipt?.fileType,
      receiptUrl: record.receipt ? await getSignedImageUrl(record.receipt.s3Key) : undefined,
      paymentProofFileName: record.paymentProof?.fileName,
      paymentProofFileType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
      paymentUploadedAt: record.paymentProof ? formatDateTime(record.paymentProof.uploadedAt) : undefined,
    })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.pendingHeading" />
      </h1>

      <StaffExpensePendingTable data={data} />
    </div>
  );
}

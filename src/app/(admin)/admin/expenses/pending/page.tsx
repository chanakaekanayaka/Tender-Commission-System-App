import { T } from "@/components/features/i18n/T";
import { AdminExpensePendingTable } from "@/components/features/other-expenses/AdminExpensePendingTable";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateTime } from "@/lib/utils/date";
import type { AdminExpensePendingRecord } from "@/shared/types/other-expense.types";

export default async function AdminExpensePendingPage() {
  await connectDB();
  // Covers two stages in one table (see AdminExpensePendingRecord's own doc comment): status stays
  // "Pending" through both, since it's Staff's confirmation (not Admin's upload) that flips it to
  // "Approved" — see confirm-payment.
  const records = await OtherExpenseModel.find({ status: "Pending", invoiceId: null }).sort({ createdAt: -1 });

  const staffIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: staffIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const data: AdminExpensePendingRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
      description: record.description,
      amount: record.amount,
      date: record.date,
      receiptFileName: record.receipt?.fileName,
      receiptFileType: record.receipt?.fileType,
      receiptUrl: record.receipt ? await getSignedImageUrl(record.receipt.s3Key) : undefined,
      // Boolean(...), not `!== null` — legacy records saved before this field existed on the
      // schema read back `undefined` here, not `null`, which `!== null` would wrongly treat as "has
      // a payment proof".
      awaitingStaffConfirmation: Boolean(record.paymentProof),
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

      <AdminExpensePendingTable data={data} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { StaffExpensePendingTable } from "@/components/features/other-expenses/StaffExpensePendingTable";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

export default async function StaffExpensePendingPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await OtherExpenseModel.find({
    status: "Pending",
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

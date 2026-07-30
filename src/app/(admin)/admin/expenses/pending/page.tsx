import { T } from "@/components/features/i18n/T";
import { AdminExpensePendingTable } from "@/components/features/other-expenses/AdminExpensePendingTable";
import connectDB from "@/lib/db/connectDB";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { AdminExpensePendingRecord } from "@/shared/types/other-expense.types";

export default async function AdminExpensePendingPage() {
  await connectDB();
  const records = await OtherExpenseModel.find({ status: "Pending" }).sort({ createdAt: -1 });

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

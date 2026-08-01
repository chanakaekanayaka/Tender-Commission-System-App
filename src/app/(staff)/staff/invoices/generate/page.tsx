import { T } from "@/components/features/i18n/T";
import { StaffInvoiceModule } from "@/components/features/invoices/StaffInvoiceModule";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import type { PendingCommission } from "@/shared/types/commission.types";
import type { StaffExpensePendingRecord } from "@/shared/types/other-expense.types";

export default async function StaffGenerateInvoicePage() {
  const user = await getCurrentUser();
  await connectDB();

  // Same real gates as Job Order Commissions Pending and Other Expenses Pending — minus anything
  // already bundled into another outstanding invoice (invoiceId: null), and minus anything Admin's
  // already mid-way through paying individually (commissionPaidAt/paymentProof set) — only
  // genuinely untouched ones are invoice-able.
  const [jobOrders, expenseRecords] = await Promise.all([
    JobOrderModel.find({
      billVerifiedAt: { $ne: null },
      commissionPaidAt: null,
      commissionRejectedAt: null,
      invoiceId: null,
      ...(user ? { createdBy: user._id } : {}),
    }).sort({ billVerifiedAt: -1 }),
    OtherExpenseModel.find({
      status: "Pending",
      paymentProof: null,
      invoiceId: null,
      ...(user ? { createdBy: user._id } : {}),
    }).sort({ createdAt: -1 }),
  ]);

  const commissions: PendingCommission[] = jobOrders.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    amount: record.commissionValue,
  }));

  const expenses: StaffExpensePendingRecord[] = expenseRecords.map((record) => ({
    id: record._id.toString(),
    description: record.description,
    amount: record.amount,
    date: record.date,
    receiptFileName: record.receipt?.fileName,
    receiptFileType: record.receipt?.fileType,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="invoices.generateHeading" />
        </h1>
      </div>

      <StaffInvoiceModule commissions={commissions} expenses={expenses} />
    </div>
  );
}

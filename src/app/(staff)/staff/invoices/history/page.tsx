import { T } from "@/components/features/i18n/T";
import { StaffInvoiceHistoryTable } from "@/components/features/invoices/StaffInvoiceHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel, type InvoiceLineItemSubdoc } from "@/lib/db/models/Invoice.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import type { InvoiceLineItem, InvoiceRequest } from "@/shared/types/invoice.types";

export default async function StaffInvoiceHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3. Every invoice they've ever
  // submitted, not just resolved ones — this doubles as their full submission history.
  const records = await InvoiceModel.find(user ? { createdBy: user._id } : {}).sort({ createdAt: -1 });

  const data: InvoiceRequest[] = await Promise.all(
    records.map(async (record) => {
      const items: InvoiceLineItem[] = record.items.map((item: InvoiceLineItemSubdoc) => ({
        id: item.refId.toString(),
        type: item.type,
        label: item.label,
        amount: item.amount,
      }));

      return {
        id: record._id.toString(),
        invoiceNo: record.invoiceNo,
        submittedBy: user ? `${user.firstName} ${user.lastName}` : "—",
        submittedDate: record.createdAt.toISOString().slice(0, 10),
        items,
        total: record.total,
        status: record.status,
        paymentBillFileName: record.paymentBill?.fileName,
        paymentBillFileType: record.paymentBill?.fileType,
        paymentBillUrl: record.paymentBill ? await getSignedImageUrl(record.paymentBill.s3Key) : undefined,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="invoices.historyHeadingStaff" />
      </h1>

      <StaffInvoiceHistoryTable data={data} />
    </div>
  );
}

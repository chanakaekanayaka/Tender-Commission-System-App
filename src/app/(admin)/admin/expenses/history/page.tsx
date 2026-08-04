import { T } from "@/components/features/i18n/T";
import { AdminExpenseHistory } from "@/components/features/other-expenses/AdminExpenseHistory";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel } from "@/lib/db/models/Invoice.model";
import { OtherExpenseModel } from "@/lib/db/models/OtherExpense.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateOnly, formatDateTime } from "@/lib/utils/date";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { findStaffIdsByName } from "@/lib/db/staffSearch";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { AdminExpenseHistoryRecord } from "@/shared/types/other-expense.types";

interface AdminExpenseHistoryPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminExpenseHistoryPage({ searchParams }: AdminExpenseHistoryPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const staffSearchIds = await findStaffIdsByName(search);
  const { rows: records, total, totalPages, page: currentPage } = await paginateFind(
    OtherExpenseModel,
    { status: { $ne: "Pending" } },
    ["description"],
    { search, page, limit: DEFAULT_PAGE_SIZE },
    { reviewedAt: -1 },
    staffSearchIds.length ? [{ createdBy: { $in: staffSearchIds } }] : [],
  );

  const staffIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: staffIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const invoiceIds = [...new Set(records.filter((record) => record.invoiceId).map((record) => record.invoiceId!.toString()))];
  const invoices = await InvoiceModel.find({ _id: { $in: invoiceIds } });
  const invoiceNoById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice.invoiceNo]));

  const data: AdminExpenseHistoryRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
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

      <AdminExpenseHistory data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

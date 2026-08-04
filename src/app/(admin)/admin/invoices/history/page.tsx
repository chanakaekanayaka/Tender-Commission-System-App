import { T } from "@/components/features/i18n/T";
import { AdminInvoiceHistoryTable } from "@/components/features/invoices/AdminInvoiceHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel, type InvoiceLineItemSubdoc } from "@/lib/db/models/Invoice.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { findStaffIdsByName } from "@/lib/db/staffSearch";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { InvoiceLineItem, InvoiceRequest } from "@/shared/types/invoice.types";

interface AdminInvoiceHistoryPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminInvoiceHistoryPage({ searchParams }: AdminInvoiceHistoryPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const staffSearchIds = await findStaffIdsByName(search);
  const { rows: records, total, totalPages, page: currentPage } = await paginateFind(
    InvoiceModel,
    { status: "Paid" },
    ["invoiceNo"],
    { search, page, limit: DEFAULT_PAGE_SIZE },
    { paidAt: -1 },
    staffSearchIds.length ? [{ createdBy: { $in: staffSearchIds } }] : [],
  );

  const staffIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: staffIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

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
        submittedBy: staffNameById.get(record.createdBy.toString()) ?? "—",
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
        <T k="invoices.historyHeadingAdmin" />
      </h1>

      <AdminInvoiceHistoryTable
        data={data}
        search={search}
        page={currentPage}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}

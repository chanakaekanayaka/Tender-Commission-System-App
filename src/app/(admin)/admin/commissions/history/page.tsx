import { T } from "@/components/features/i18n/T";
import { AdminCommissionHistory } from "@/components/features/commissions/AdminCommissionHistory";
import connectDB from "@/lib/db/connectDB";
import { InvoiceModel } from "@/lib/db/models/Invoice.model";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateTime } from "@/lib/utils/date";
import { getProfitBase } from "@/lib/utils/jobOrderExpenses";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { findStaffIdsByName } from "@/lib/db/staffSearch";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { AdminCommissionHistoryRecord } from "@/shared/types/commission.types";

interface AdminCommissionHistoryPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminCommissionHistoryPage({ searchParams }: AdminCommissionHistoryPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  // Staff confirming the receipt (not merely Admin paying) is what actually moves a commission into
  // History — see confirm-commission-payment. Bundling into an Invoice and Admin paying that
  // invoice sets these same fields too (see PATCH /api/invoices/[id]/pay), so both paths land here.
  const staffIds = await findStaffIdsByName(search);
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      { commissionPaymentConfirmedAt: { $ne: null } },
      ["jobOrderNo"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
      { commissionPaymentConfirmedAt: -1 },
      staffIds.length ? [{ createdBy: { $in: staffIds } }] : [],
    ),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const rowCreatorIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: rowCreatorIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const invoiceIds = [...new Set(records.filter((record) => record.invoiceId).map((record) => record.invoiceId!.toString()))];
  const invoices = await InvoiceModel.find({ _id: { $in: invoiceIds } });
  const invoiceNoById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice.invoiceNo]));

  const data: AdminCommissionHistoryRecord[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
      jobOrderNo: record.jobOrderNo,
      profit: getProfitBase(record, vatRate),
      commissionPaid: record.commissionValue,
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

      <AdminCommissionHistory data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

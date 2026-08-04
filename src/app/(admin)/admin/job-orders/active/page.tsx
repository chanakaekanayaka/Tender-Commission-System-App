import { T } from "@/components/features/i18n/T";
import { AdminActiveTable } from "@/components/features/job-orders/AdminActiveTable";
import connectDB from "@/lib/db/connectDB";
import {
  JobOrderModel,
  type JobOrderExpenseSubdoc,
  type JobOrderLineItemSubdoc,
  type JobOrderReceiptSubdoc,
} from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { getExpensesAmount } from "@/lib/utils/jobOrderExpenses";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { AdminActiveJobOrder } from "@/shared/types/job-order.types";

interface AdminActiveJobOrdersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminActiveJobOrdersPage({ searchParams }: AdminActiveJobOrdersPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  // Only bill-verified rows leave for Job Order Pending — see verify-bill. Deleted rows leave
  // straight to History instead — see the delete route.
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      { billVerifiedAt: null, deletedAt: null },
      ["jobOrderNo", "procurementNo", "procuringEntity"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
    ),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;
  const sumSubTotals = (rows: JobOrderLineItemSubdoc[]) =>
    rows.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal, 0);

  const data: AdminActiveJobOrder[] = await Promise.all(
    records.map(async (record) => {
      // Receipts always count; manual entries only when Staff hasn't zeroed them out — same rule
      // generate-bill uses to compute otherExpensesTotal, so this matches the actual billed figure.
      // Only receipts carry a real uploaded file, so only they get a signed URL to preview.
      const receiptExpenses = await Promise.all(
        record.receipts.map(async (receipt: JobOrderReceiptSubdoc) => ({
          label: receipt.fileName,
          amount: receipt.amount,
          fileUrl: await getSignedImageUrl(receipt.s3Key),
          fileType: receipt.fileType,
        })),
      );
      const otherExpenses = [
        ...receiptExpenses,
        ...(record.expensesZeroed
          ? []
          : record.otherExpenses.map((expense: JobOrderExpenseSubdoc) => ({
              label: expense.label || "Other Expense",
              amount: expense.amount,
            }))),
      ];
      const otherExpensesTotal = getExpensesAmount(record);

      return {
        id: record._id.toString(),
        jobOrderNo: record.jobOrderNo,
        procurementNo: record.procurementNo,
        procuringEntity: record.procuringEntity,
        total: sumSubTotals(record.lineItems),
        profit: record.markupValue,
        billAmount: record.billAmount,
        otherExpenses,
        otherExpensesTotal,
        billSubmitted: record.billSubmittedAt !== null,
        status: record.status,
        createdAt: record.createdAt.toISOString().slice(0, 10),
        documentName: record.billDocument?.fileName,
        documentUrl: record.billDocument ? await getSignedImageUrl(record.billDocument.s3Key) : undefined,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="activeJobOrders.heading" />
        </h1>
      </div>

      <AdminActiveTable data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

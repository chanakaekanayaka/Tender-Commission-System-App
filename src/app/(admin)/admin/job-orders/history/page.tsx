import { T } from "@/components/features/i18n/T";
import { JobOrderHistoryTable } from "@/components/features/job-orders/JobOrderHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { getExpensesAmount } from "@/lib/utils/jobOrderExpenses";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

interface AdminJobOrderHistoryPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminJobOrderHistoryPage({ searchParams }: AdminJobOrderHistoryPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  // A job order is done for good once payment has been marked fully complete — that's the one
  // signal that moves it out of Pending and into History (see complete-payment route). A deleted
  // job order (see the delete route) also lands here, marked "Deleted" instead of "Completed".
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      { $or: [{ paymentVerifiedAt: { $ne: null } }, { deletedAt: { $ne: null } }] },
      ["jobOrderNo", "procurementNo"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
      { paymentVerifiedAt: -1 },
    ),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const data: JobOrderHistoryRecord[] = records.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    completionDate: (record.paymentVerifiedAt ?? record.deletedAt)!.toISOString().slice(0, 10),
    originalTotal: record.originalLineItems.reduce(
      (sum: number, row: JobOrderLineItemSubdoc) =>
        sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal,
      0,
    ),
    // Same "what actually went to Staff" figure Active/Pending use — not the entity's bill amount.
    finalValue: getExpensesAmount(record),
    // Admin sees the company's own profit share (frozen at bill generation).
    profit: record.profit ?? 0,
    // Boolean(...), not `!== null` — legacy job orders saved before this field existed read back
    // `undefined` here, not `null`, which `!== null` would wrongly treat as "deleted".
    isDeleted: Boolean(record.deletedAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderHistory.heading" />
        </h1>
      </div>

      <JobOrderHistoryTable data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { ActiveJobOrdersTable } from "@/components/features/job-orders/ActiveJobOrdersTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { ActiveJobOrder } from "@/shared/types/job-order.types";

interface StaffActiveJobOrdersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function StaffActiveJobOrdersPage({ searchParams }: StaffActiveJobOrdersPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const user = await getCurrentUser();
  await connectDB();
  // Staff sees their own records plus any Admin created and assigned to them
  // (AI_INSTRUCTIONS.md §3). Only bill-verified rows leave for Job Order Pending — see verify-bill.
  // Deleted rows leave straight to History instead — see the delete route.
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      {
        billVerifiedAt: null,
        deletedAt: null,
        ...(user ? { $or: [{ createdBy: user._id }, { assignedStaffId: user._id.toString() }] } : {}),
      },
      ["jobOrderNo", "procurementNo", "procuringEntity"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
    ),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;
  const sumSubTotals = (rows: JobOrderLineItemSubdoc[]) =>
    rows.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal, 0);

  const data: ActiveJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      procuringEntity: record.procuringEntity,
      total: sumSubTotals(record.lineItems),
      commissionValue: record.commissionValue,
      billSubmitted: record.billSubmittedAt !== null,
      status: record.status,
      createdAt: record.createdAt.toISOString().slice(0, 10),
      documentName: record.billDocument?.fileName,
      documentUrl: record.billDocument ? await getSignedImageUrl(record.billDocument.s3Key) : undefined,
      isAdminAssigned: Boolean(user) && record.createdBy.toString() !== user!._id.toString(),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="activeJobOrders.heading" />
        </h1>
      </div>

      <ActiveJobOrdersTable data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

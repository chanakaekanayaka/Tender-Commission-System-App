import { T } from "@/components/features/i18n/T";
import { StaffPendingJobOrders } from "@/components/features/job-orders/StaffPendingJobOrders";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { getExpensesAmount } from "@/lib/utils/jobOrderExpenses";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

interface StaffPendingJobOrdersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function StaffPendingJobOrdersPage({ searchParams }: StaffPendingJobOrdersPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const user = await getCurrentUser();
  await connectDB();
  // Staff sees their own records plus any Admin created and assigned to them
  // (AI_INSTRUCTIONS.md §3). Once Admin verifies the payment proof, Staff's own part is done — the
  // row moves straight to Staff's own Job Order History from there (see that page), even though
  // Admin's own Job Order Pending still shows it until they separately mark payment complete.
  const baseFilter = {
    billVerifiedAt: { $ne: null },
    paymentVerifiedAt: null,
    paymentProofVerifiedAt: null,
    ...(user ? { $or: [{ createdBy: user._id }, { assignedStaffId: user._id.toString() }] } : {}),
  };

  const [{ rows: records, total, totalPages, page: currentPage }, allPendingForTotal] = await Promise.all([
    paginateFind(JobOrderModel, baseFilter, ["jobOrderNo"], { search, page, limit: DEFAULT_PAGE_SIZE }, {
      "billDocument.generatedAt": -1,
    }),
    // "Total Pending" reflects every matching row, not just this page — a lightweight projection
    // (no S3 signed-URL resolution) so it stays cheap even as the list grows, and intentionally
    // ignores the search box (same as before pagination existed: search only filtered what was
    // displayed, never the summary total).
    JobOrderModel.find(baseFilter).select("receipts otherExpenses expensesZeroed"),
  ]);
  const totalPendingAmount = allPendingForTotal.reduce((sum, record) => sum + getExpensesAmount(record), 0);

  const data: StaffPendingJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      amount: getExpensesAmount(record),
      dateSubmitted: record.billDocument!.generatedAt.toISOString().slice(0, 10),
      paymentProofName: record.paymentProof?.fileName,
      paymentProofType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
      paymentProofVerified: record.paymentProofVerifiedAt !== null,
      isAdminAssigned: Boolean(user) && record.createdBy.toString() !== user!._id.toString(),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="staffPendingJobOrders.heading" />
        </h1>
      </div>

      <StaffPendingJobOrders
        data={data}
        search={search}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        totalPendingAmount={totalPendingAmount}
      />
    </div>
  );
}

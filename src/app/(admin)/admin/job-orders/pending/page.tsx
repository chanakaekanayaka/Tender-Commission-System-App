import { T } from "@/components/features/i18n/T";
import { AdminPendingTable } from "@/components/features/job-orders/AdminPendingTable";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { getExpensesAmount } from "@/lib/utils/jobOrderExpenses";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { AdminPendingJobOrder } from "@/shared/types/job-order.types";

interface AdminPendingJobOrdersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminPendingJobOrdersPage({ searchParams }: AdminPendingJobOrdersPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      { billVerifiedAt: { $ne: null }, paymentVerifiedAt: null },
      ["jobOrderNo", "procurementNo"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
      { "billDocument.generatedAt": -1 },
    ),
    getOrCreateSystemConfig(),
  ]);

  const data: AdminPendingJobOrder[] = await Promise.all(
    records.map(async (record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      procuringEntity: record.procuringEntity,
      billAmount: record.billAmount ?? 0,
      expensesAmount: getExpensesAmount(record),
      billGeneratedDate: record.billDocument!.generatedAt.toISOString().slice(0, 10),
      entityAddress: record.metadata.address,
      entityEmail: record.metadata.email,
      paymentProofName: record.paymentProof?.fileName,
      paymentProofType: record.paymentProof?.fileType,
      paymentProofUrl: record.paymentProof ? await getSignedImageUrl(record.paymentProof.s3Key) : undefined,
      paymentProofVerified: record.paymentProofVerifiedAt !== null,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderPending.heading" />
        </h1>
      </div>

      <AdminPendingTable
        data={data}
        search={search}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        paymentDueDays={systemConfig.paymentDueDays}
      />
    </div>
  );
}

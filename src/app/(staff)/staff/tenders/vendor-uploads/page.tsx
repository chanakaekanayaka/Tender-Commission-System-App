import { T } from "@/components/features/i18n/T";
import { VendorExcelUploadPanel } from "@/components/features/tenders/VendorExcelUploadPanel";
import { VendorExcelUploadTable } from "@/components/features/tenders/VendorExcelUploadTable";
import connectDB from "@/lib/db/connectDB";
import { VendorExcelUploadModel } from "@/lib/db/models/VendorExcelUpload.model";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { formatDateTime } from "@/lib/utils/date";
import type { VendorExcelUploadSummary } from "@/shared/types/vendorExcelUpload.types";

const SEARCH_FIELDS = ["procurementNo", "sourceDocument.fileName"];

interface VendorExcelUploadsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

/** Staff sees only their own uploads (AI_INSTRUCTIONS.md §3), same "own records" scope as their
 *  Price Schedule History — the company-wide Market Analysis these uploads feed stays shared, but
 *  managing the upload itself (view/delete) is personal to whoever uploaded it. */
export default async function StaffVendorExcelUploadsPage({ searchParams }: VendorExcelUploadsPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own uploads — AI_INSTRUCTIONS.md §3.
  const baseFilter = user ? { createdBy: user._id } : {};
  const { rows: records, total, totalPages, page: currentPage } = await paginateFind(
    VendorExcelUploadModel,
    baseFilter,
    SEARCH_FIELDS,
    { search, page, limit: DEFAULT_PAGE_SIZE },
  );

  const data: VendorExcelUploadSummary[] = records.map((record) => ({
    id: record._id.toString(),
    fileName: record.sourceDocument.fileName,
    procurementNo: record.procurementNo,
    status: record.status,
    confirmed: record.confirmed,
    vendorCount: record.vendorBlocks.length,
    uploadedAt: formatDateTime(record.createdAt),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="vendorExcelUploads.heading" />
      </h1>

      <VendorExcelUploadPanel />
      <VendorExcelUploadTable data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { PriceScheduleHistoryTable } from "@/components/features/tenders/PriceScheduleHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { buildSearchFilter, paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import { formatDateTime } from "@/lib/utils/date";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

const SEARCH_FIELDS = ["procurementNo", "procuringEntity"];

interface PriceScheduleHistoryPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function PriceScheduleHistoryPage({ searchParams }: PriceScheduleHistoryPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const [{ rows: records, total, totalPages, page: currentPage }, allMatching] = await Promise.all([
    paginateFind(PriceScheduleModel, {}, SEARCH_FIELDS, { search, page, limit: DEFAULT_PAGE_SIZE }, { createdAt: -1 }),
    // Export needs every matching id, not just this page's — see PriceScheduleHistoryTable's
    // ExportMenu, which exports "what the user has searched for," not "what's on screen."
    PriceScheduleModel.find(buildSearchFilter({}, SEARCH_FIELDS, search)).select("_id"),
  ]);

  const data: PriceScheduleSummary[] = records.map((record) => ({
    id: record._id.toString(),
    procurementNo: record.procurementNo,
    procurementTitle: record.procurementTitle,
    entity: record.procuringEntity,
    closingDate: record.closingDate.toISOString().slice(0, 10),
    uploadedAt: formatDateTime(record.createdAt),
    totalValue: record.totalValue,
    status: record.status,
  }));
  const allMatchingIds = allMatching.map((record) => record._id.toString());

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="tenders.historyHeadingAdmin" />
      </h1>
      <PriceScheduleHistoryTable
        data={data}
        search={search}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        allMatchingIds={allMatchingIds}
      />
    </div>
  );
}

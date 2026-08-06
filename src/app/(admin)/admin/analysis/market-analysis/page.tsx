import { T } from "@/components/features/i18n/T";
import { TenderComparisonTable } from "@/components/features/items/TenderComparisonTable";
import connectDB from "@/lib/db/connectDB";
import { getTenderMarketComparisons } from "@/lib/db/marketAnalysis";
import { parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";

interface AdminMarketAnalysisPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminMarketAnalysisPage({ searchParams }: AdminMarketAnalysisPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const { comparisons, total, page: currentPage, totalPages } = await getTenderMarketComparisons(
    page,
    DEFAULT_PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.marketAnalysisTitle" />
      </h1>
      <TenderComparisonTable
        data={comparisons}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        limit={DEFAULT_PAGE_SIZE}
      />
    </div>
  );
}

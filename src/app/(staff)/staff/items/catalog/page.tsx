import { T } from "@/components/features/i18n/T";
import { ItemCatalogForm } from "@/components/features/items/ItemCatalogForm";
import connectDB from "@/lib/db/connectDB";
import { listCatalogItems } from "@/lib/db/items";
import { parsePageParam } from "@/lib/db/pagination";

// Matches the grid's responsive column counts (2/3/4/5) better than the generic table page size.
const PAGE_SIZE = 12;

interface StaffItemCatalogPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function StaffItemCatalogPage({ searchParams }: StaffItemCatalogPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const { items, total, totalPages, page: currentPage } = await listCatalogItems({ search, page, limit: PAGE_SIZE });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.catalogTitle" />
      </h1>
      <ItemCatalogForm data={items} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}

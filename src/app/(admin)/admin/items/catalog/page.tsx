import { T } from "@/components/features/i18n/T";
import { ItemCatalogForm } from "@/components/features/items/ItemCatalogForm";
import connectDB from "@/lib/db/connectDB";
import { getCatalogItems } from "@/lib/db/items";

export default async function AdminItemCatalogPage() {
  await connectDB();
  const items = await getCatalogItems();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.catalogTitle" />
      </h1>
      <ItemCatalogForm initialItems={items} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { ItemCatalogForm } from "@/components/features/items/ItemCatalogForm";
import { catalogItems } from "@/lib/mock/items.mock";

export default function StaffItemCatalogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.catalogTitle" />
      </h1>
      <ItemCatalogForm initialItems={catalogItems} />
    </div>
  );
}

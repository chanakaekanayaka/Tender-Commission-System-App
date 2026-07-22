import { T } from "@/components/features/i18n/T";
import { SpecsDocumentGenerator } from "@/components/features/items/SpecsDocumentGenerator";
import connectDB from "@/lib/db/connectDB";
import { getCatalogItems } from "@/lib/db/items";

export default async function StaffCreateSpecsDocPage() {
  await connectDB();
  const items = await getCatalogItems();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.createSpecsDocTitle" />
      </h1>
      <SpecsDocumentGenerator items={items} />
    </div>
  );
}

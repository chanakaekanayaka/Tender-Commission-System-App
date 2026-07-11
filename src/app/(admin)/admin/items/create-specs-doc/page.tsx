import { T } from "@/components/features/i18n/T";
import { SpecsDocumentGenerator } from "@/components/features/items/SpecsDocumentGenerator";
import { catalogItems } from "@/lib/mock/items.mock";

export default function AdminCreateSpecsDocPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.createSpecsDocTitle" />
      </h1>
      <SpecsDocumentGenerator items={catalogItems} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { TenderCreateForm } from "@/components/features/tenders/TenderCreateForm";

export default function CreatePriceSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="tenders.createHeading" />
        </h1>
      </div>

      <TenderCreateForm />
    </div>
  );
}

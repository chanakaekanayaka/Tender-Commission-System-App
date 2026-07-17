import { T } from "@/components/features/i18n/T";
import { TenderCreateForm } from "@/components/features/tenders/TenderCreateForm";
import connectDB from "@/lib/db/connectDB";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";

export default async function CreatePriceSchedulePage() {
  await connectDB();
  const config = await getOrCreateSystemConfig();
  const vatRate = config.isVatRegistered ? config.vatPercentage / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="tenders.createHeading" />
        </h1>
      </div>

      <TenderCreateForm vatRate={vatRate} />
    </div>
  );
}

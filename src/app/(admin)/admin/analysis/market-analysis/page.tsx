import { T } from "@/components/features/i18n/T";
import { MarketAnalysisTable } from "@/components/features/items/MarketAnalysisTable";
import { marketAnalysisData } from "@/lib/mock/items.mock";

export default function AdminMarketAnalysisPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="items.marketAnalysisTitle" />
      </h1>
      <MarketAnalysisTable data={marketAnalysisData} />
    </div>
  );
}

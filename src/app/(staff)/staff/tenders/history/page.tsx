import { PriceScheduleHistoryTable } from "@/components/features/tenders/PriceScheduleHistoryTable";
import { priceScheduleHistory } from "@/lib/mock/priceSchedules.mock";

export default function PriceScheduleHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">My Price Schedules</h1>
      <PriceScheduleHistoryTable data={priceScheduleHistory} />
    </div>
  );
}

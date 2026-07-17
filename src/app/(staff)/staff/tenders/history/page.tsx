import { T } from "@/components/features/i18n/T";
import { PriceScheduleHistoryTable } from "@/components/features/tenders/PriceScheduleHistoryTable";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

export default async function PriceScheduleHistoryPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3.
  const records = await PriceScheduleModel.find(user ? { createdBy: user._id } : {}).sort({ createdAt: -1 });

  const data: PriceScheduleSummary[] = records.map((record) => ({
    id: record._id.toString(),
    procurementNo: record.procurementNo,
    entity: record.procuringEntity,
    closingDate: record.closingDate.toISOString().slice(0, 10),
    totalValue: record.totalValue,
    status: record.status,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="tenders.historyHeadingStaff" />
      </h1>
      <PriceScheduleHistoryTable data={data} />
    </div>
  );
}

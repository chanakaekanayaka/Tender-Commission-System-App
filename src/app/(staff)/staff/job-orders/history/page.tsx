import { T } from "@/components/features/i18n/T";
import { JobOrderHistoryTable } from "@/components/features/job-orders/JobOrderHistoryTable";
import { jobOrderHistory } from "@/lib/mock/jobOrderHistory.mock";

export default function StaffJobOrderHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderHistory.heading" />
        </h1>
      </div>

      <JobOrderHistoryTable data={jobOrderHistory} />
    </div>
  );
}

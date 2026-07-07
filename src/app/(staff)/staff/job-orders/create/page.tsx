import { T } from "@/components/features/i18n/T";
import { JobOrderCreateForm } from "@/components/features/job-orders/JobOrderCreateForm";

export default function StaffJobOrderCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderCreate.heading" />
        </h1>
      </div>

      <JobOrderCreateForm role="staff" />
    </div>
  );
}

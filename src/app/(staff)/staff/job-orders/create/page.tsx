import { T } from "@/components/features/i18n/T";
import { JobOrderStepper } from "@/components/features/job-orders/JobOrderStepper";

export default function StaffJobOrderCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderCreate.heading" />
        </h1>
      </div>

      <JobOrderStepper role="staff" />
    </div>
  );
}

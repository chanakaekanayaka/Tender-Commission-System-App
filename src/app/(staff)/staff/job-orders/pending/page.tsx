import { T } from "@/components/features/i18n/T";
import { StaffPendingJobOrders } from "@/components/features/job-orders/StaffPendingJobOrders";
import { staffPendingJobOrders } from "@/lib/mock/staffPendingJobOrders.mock";

export default function StaffPendingJobOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="staffPendingJobOrders.heading" />
        </h1>
      </div>

      <StaffPendingJobOrders initialData={staffPendingJobOrders} />
    </div>
  );
}

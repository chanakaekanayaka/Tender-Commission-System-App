import { T } from "@/components/features/i18n/T";
import { ActiveJobOrdersTable } from "@/components/features/job-orders/ActiveJobOrdersTable";
import { activeJobOrders } from "@/lib/mock/activeJobOrders.mock";

export default function StaffActiveJobOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="activeJobOrders.heading" />
        </h1>
      </div>

      <ActiveJobOrdersTable initialData={activeJobOrders} />
    </div>
  );
}

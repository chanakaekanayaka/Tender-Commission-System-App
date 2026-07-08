import { T } from "@/components/features/i18n/T";
import { AdminActiveTable } from "@/components/features/job-orders/AdminActiveTable";
import { adminActiveJobOrders } from "@/lib/mock/adminJobOrders.mock";

export default function AdminActiveJobOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="activeJobOrders.heading" />
        </h1>
      </div>

      <AdminActiveTable initialData={adminActiveJobOrders} />
    </div>
  );
}

import { T } from "@/components/features/i18n/T";
import { PendingOrdersTable } from "@/components/features/dashboard/PendingOrdersTable";
import { StaffPerformanceChart } from "@/components/features/dashboard/StaffPerformanceChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatLKR } from "@/lib/utils/currency";
import {
  pendingOrders,
  staffMonthlyPerformance,
  staffName,
  staffStats,
} from "@/lib/mock/staff-dashboard.mock";

export default function StaffDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="dashboard.greeting" values={{ name: staffName }} />
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label={<T k="dashboard.monthlyTarget" />}
          value={formatLKR(staffStats.monthlyTarget)}
        />
        <StatCard
          label={<T k="dashboard.pendingCommission" />}
          value={formatLKR(staffStats.pendingCommission)}
        />
        <StatCard
          label={<T k="dashboard.ordersToComplete" />}
          value={String(staffStats.ordersToComplete)}
        />
      </div>

      <PendingOrdersTable orders={pendingOrders} />

      <div className="rounded-none border border-border bg-card p-4">
        <h2 className="font-semibold text-ink">
          <T k="dashboard.myPerformance" />
        </h2>
        <div className="mt-4 h-64">
          <StaffPerformanceChart data={staffMonthlyPerformance} />
        </div>
      </div>
    </div>
  );
}

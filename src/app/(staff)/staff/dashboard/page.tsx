import { redirect } from "next/navigation";
import { T } from "@/components/features/i18n/T";
import { MonthlyTargetCard } from "@/components/features/dashboard/MonthlyTargetCard";
import { PendingOrdersTable } from "@/components/features/dashboard/PendingOrdersTable";
import { PriceScheduleChart } from "@/components/features/dashboard/PriceScheduleChart";
import { StaffPerformanceChart } from "@/components/features/dashboard/StaffPerformanceChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatLKR } from "@/lib/utils/currency";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  pendingOrders,
  priceScheduleTrend,
  staffMonthlyPerformance,
  staffStats,
} from "@/lib/mock/staff-dashboard.mock";

export default async function StaffDashboardPage() {
  // The layout above already redirects unauthenticated/blocked users — this is just to read the name/target.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="dashboard.greeting" values={{ name: user.firstName }} />
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MonthlyTargetCard
          label={<T k="dashboard.monthlyTarget" />}
          targetAmount={user.monthlyTarget}
          achievedAmount={staffStats.achievedAmount}
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

      <PriceScheduleChart data={priceScheduleTrend} />
    </div>
  );
}

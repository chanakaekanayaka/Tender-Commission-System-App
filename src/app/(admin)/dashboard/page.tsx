import { DashboardKpiCard } from "@/components/ui/DashboardKpiCard";
import { PerformanceChart } from "@/components/features/dashboard/PerformanceChart";
import { currentMonth, dashboardKpis, monthlyPerformance } from "@/lib/mock/dashboard.mock";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Company Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dashboardKpis.map((kpi) => (
          <DashboardKpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      <PerformanceChart data={monthlyPerformance} highlightMonth={currentMonth} />
    </div>
  );
}

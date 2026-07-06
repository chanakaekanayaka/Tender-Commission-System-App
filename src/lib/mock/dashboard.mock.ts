import { formatCompactLKR, formatLKR } from "@/lib/utils/currency";
import type { KpiCardData, MonthlyPerformance } from "@/types/dashboard";

// TODO: replace with data fetched from src/services once the dashboard API route exists.

export const monthlyPerformance: MonthlyPerformance[] = [
  { month: "Jan", sales: 380_000, target: 500_000 },
  { month: "Feb", sales: 505_000, target: 500_000 },
  { month: "Mar", sales: 295_000, target: 500_000 },
  { month: "Apr", sales: 560_000, target: 500_000 },
  { month: "May", sales: 465_000, target: 500_000 },
  { month: "Jun", sales: 430_000, target: 500_000 },
  { month: "Jul", sales: 180_000, target: 500_000 },
  { month: "Aug", sales: 165_000, target: 500_000 },
  { month: "Sep", sales: 195_000, target: 500_000 },
  { month: "Oct", sales: 170_000, target: 500_000 },
  { month: "Nov", sales: 155_000, target: 500_000 },
  { month: "Dec", sales: 140_000, target: 500_000 },
];

export const currentMonth = "Jun";

export const dashboardKpis: KpiCardData[] = [
  {
    id: "monthly-sales-target",
    label: "Monthly Sales Target",
    value: `${formatCompactLKR(4_200_000)} / ${formatCompactLKR(6_000_000)}`,
    helperText: "70% achieved · 8 days left",
    progressPercent: 70,
  },
  {
    id: "total-pending-payments",
    label: "Total Pending Payments",
    value: formatLKR(2_145_300),
    helperText: "across 14 job orders",
  },
  {
    id: "total-pending-orders",
    label: "Total Pending Orders",
    value: "23",
    helperText: "5 overdue",
    showWarningIcon: true,
    helperLink: { label: "view active", href: "/job-orders" },
  },
];

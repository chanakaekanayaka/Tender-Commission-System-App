import type { PendingOrderRow, PriceScheduleTrendPoint, StaffMonthlyPerformance } from "@/types/dashboard";

// Name and monthlyTarget now come from the logged-in user's real DB record (see staff/dashboard/page.tsx).
// Everything below is still a placeholder until Job Orders / Commissions have their own backend.

export const staffStats = {
  achievedAmount: 550_000,
  pendingCommission: 70_000,
  ordersToComplete: 10,
};

export const pendingOrders: PendingOrderRow[] = [
  { id: "JO-2026-0142", jobNumber: "JO-2026-0142" },
  { id: "JO-2026-0139", jobNumber: "JO-2026-0139" },
  { id: "JO-2026-0135", jobNumber: "JO-2026-0135" },
  { id: "JO-2026-0128", jobNumber: "JO-2026-0128" },
];

export const staffMonthlyPerformance: StaffMonthlyPerformance[] = [
  { month: "Jan 2026", amount: 62_000 },
  { month: "Feb 2026", amount: 85_500 },
  { month: "Mar 2026", amount: 70_000 },
];

export const priceScheduleTrend: PriceScheduleTrendPoint[] = [
  { month: "Jan 2026", count: 4 },
  { month: "Feb 2026", count: 7 },
  { month: "Mar 2026", count: 5 },
  { month: "Apr 2026", count: 9 },
  { month: "May 2026", count: 6 },
  { month: "Jun 2026", count: 11 },
];

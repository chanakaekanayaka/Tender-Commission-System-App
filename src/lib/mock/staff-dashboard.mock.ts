import type { PendingOrderRow, StaffMonthlyPerformance } from "@/types/dashboard";

// TODO: replace with data fetched from src/services once the staff dashboard API route exists.

export const staffName = "Nimal";

export const staffStats = {
  monthlyTarget: 900_000,
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

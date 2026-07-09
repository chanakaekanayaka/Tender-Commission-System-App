import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

// Stands in for a real backend move (Active → Pending) in this UI-only mock phase
// (AGENTS.md): "Generate Bill" writes here, and StaffPendingJobOrders merges it in on
// mount, so the row genuinely appears on the Pending page across a real navigation.
const STORAGE_KEY = "tcms-staff-generated-pending-job-orders";

export function addGeneratedPendingJobOrder(row: StaffPendingJobOrder): void {
  if (typeof window === "undefined") return;
  const existing = readGeneratedPendingJobOrders();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, row]));
}

export function readGeneratedPendingJobOrders(): StaffPendingJobOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StaffPendingJobOrder[]) : [];
  } catch {
    return [];
  }
}

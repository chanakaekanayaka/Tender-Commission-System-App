import type { AdminActiveJobOrder } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=active) once that route exists.
export const adminActiveJobOrders: AdminActiveJobOrder[] = [
  { id: "1", jobOrderNo: "JO-2026-0142", procurementNo: "PROC/2026/001", completedStep: 1, status: "Draft" },
  { id: "2", jobOrderNo: "JO-2026-0139", procurementNo: "PROC/2026/002", completedStep: 2, status: "Draft" },
  { id: "3", jobOrderNo: "JO-2026-0135", procurementNo: "PROC/2026/004", completedStep: 3, status: "Completed" },
  {
    id: "4",
    jobOrderNo: "JO-2026-0128",
    procurementNo: "PROC/2026/001",
    completedStep: 3,
    status: "Completed",
    documentName: "JO-2026-0128-bill.pdf",
  },
];

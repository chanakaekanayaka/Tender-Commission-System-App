import type { AdminActiveJobOrder, AdminPendingJobOrder } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=active) once that route exists.
export const adminActiveJobOrders: AdminActiveJobOrder[] = [
  { id: "1", jobOrderNo: "JO-2026-0142", procurementNo: "PROC/2026/001", completedStep: 1 },
  { id: "2", jobOrderNo: "JO-2026-0139", procurementNo: "PROC/2026/002", completedStep: 2 },
  { id: "3", jobOrderNo: "JO-2026-0135", procurementNo: "PROC/2026/004", completedStep: 3 },
  {
    id: "4",
    jobOrderNo: "JO-2026-0128",
    procurementNo: "PROC/2026/001",
    completedStep: 3,
    documentName: "JO-2026-0128-bill.pdf",
  },
];

// TODO: replace with a real fetch (GET /api/job-orders?status=payment-pending) once that route exists.
// Every row here is, by definition, awaiting payment — there is no other status to filter by.
export const adminPendingJobOrders: AdminPendingJobOrder[] = [
  {
    id: "1",
    jobOrderNo: "JO-2026-0110",
    procurementNo: "PROC/2026/002",
    billAmount: 245_500,
    billGeneratedDate: "2026-06-18",
  },
  {
    id: "2",
    jobOrderNo: "JO-2026-0104",
    procurementNo: "PROC/2026/004",
    billAmount: 189_200,
    billGeneratedDate: "2026-06-22",
  },
  {
    id: "3",
    jobOrderNo: "JO-2026-0098",
    procurementNo: "PROC/2026/001",
    billAmount: 312_750,
    billGeneratedDate: "2026-06-29",
  },
];

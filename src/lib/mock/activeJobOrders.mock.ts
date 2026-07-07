import type { ActiveJobOrder } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=active) once that route exists.
export const activeJobOrders: ActiveJobOrder[] = [
  { id: "1", jobOrderNo: "JO-2026-0142", procurementNo: "PROC/2026/001", status: "Pending" },
  {
    id: "2",
    jobOrderNo: "JO-2026-0139",
    procurementNo: "PROC/2026/002",
    status: "Bill Created",
    documentName: "JO-2026-0139-bill.pdf",
  },
  { id: "3", jobOrderNo: "JO-2026-0135", procurementNo: "PROC/2026/004", status: "Pending" },
  {
    id: "4",
    jobOrderNo: "JO-2026-0128",
    procurementNo: "PROC/2026/001",
    status: "Bill Created",
    documentName: "JO-2026-0128-bill.pdf",
  },
];

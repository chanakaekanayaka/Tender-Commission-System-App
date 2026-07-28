import type { ActiveJobOrder } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=active) once that route exists.
// Same job order numbers as adminActiveJobOrders — same underlying job orders, viewed from
// Staff's own Active list instead of Admin's. Only `jobOrderNo` is actually consumed by callers
// (the Other Expenses "Job Order No" dropdown), so the other fields are placeholder values.
export const activeJobOrders: ActiveJobOrder[] = [
  {
    id: "1",
    jobOrderNo: "JO-2026-0142",
    procurementNo: "PROC/2026/001",
    procuringEntity: "Ministry of Health",
    total: 0,
    commissionValue: 0,
    billSubmitted: false,
    status: "Draft",
    createdAt: "2026-01-01",
  },
  {
    id: "2",
    jobOrderNo: "JO-2026-0139",
    procurementNo: "PROC/2026/002",
    procuringEntity: "Ministry of Education",
    total: 0,
    commissionValue: 0,
    billSubmitted: false,
    status: "Draft",
    createdAt: "2026-01-01",
    documentName: "JO-2026-0139-bill.pdf",
  },
  {
    id: "3",
    jobOrderNo: "JO-2026-0135",
    procurementNo: "PROC/2026/004",
    procuringEntity: "Ministry of Defence",
    total: 0,
    commissionValue: 0,
    billSubmitted: false,
    status: "Completed",
    createdAt: "2026-01-01",
  },
  {
    id: "4",
    jobOrderNo: "JO-2026-0128",
    procurementNo: "PROC/2026/001",
    procuringEntity: "Ministry of Health",
    total: 0,
    commissionValue: 0,
    billSubmitted: false,
    status: "Completed",
    createdAt: "2026-01-01",
    documentName: "JO-2026-0128-bill.pdf",
  },
];

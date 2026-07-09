import { jobOrderMetadataByProcurement, procurementLineItems } from "@/lib/mock/jobOrders.mock";
import type { JobOrderDetail } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders/{jobOrderNo}) once that route exists.
// Job order numbers here match adminActiveJobOrders in adminJobOrders.mock.ts — same
// underlying job orders, viewed from Staff's dashboard instead of Admin's Active table.
export const jobOrderDetailsByJobNumber: Record<string, JobOrderDetail> = {
  "JO-2026-0142": {
    jobOrderNo: "JO-2026-0142",
    procurementNo: "PROC/2026/001",
    metadata: jobOrderMetadataByProcurement["PROC/2026/001"],
    lineItems: procurementLineItems["PROC/2026/001"],
    commissionValue: 45_000,
    otherExpensesTotal: 12_500,
  },
  "JO-2026-0139": {
    jobOrderNo: "JO-2026-0139",
    procurementNo: "PROC/2026/002",
    metadata: jobOrderMetadataByProcurement["PROC/2026/002"],
    lineItems: procurementLineItems["PROC/2026/002"],
    commissionValue: 38_000,
    otherExpensesTotal: 9_800,
  },
  "JO-2026-0135": {
    jobOrderNo: "JO-2026-0135",
    procurementNo: "PROC/2026/004",
    metadata: jobOrderMetadataByProcurement["PROC/2026/004"],
    lineItems: procurementLineItems["PROC/2026/004"],
    commissionValue: 95_000,
    otherExpensesTotal: 22_000,
  },
  "JO-2026-0128": {
    jobOrderNo: "JO-2026-0128",
    procurementNo: "PROC/2026/001",
    metadata: jobOrderMetadataByProcurement["PROC/2026/001"],
    lineItems: procurementLineItems["PROC/2026/001"],
    commissionValue: 45_000,
    otherExpensesTotal: 12_500,
    documentName: "JO-2026-0128-bill.pdf",
  },
};

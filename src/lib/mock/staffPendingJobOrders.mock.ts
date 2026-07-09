import type { StaffPendingJobOrder } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=payment-pending&assignee=me)
// once that route exists.
export const staffPendingJobOrders: StaffPendingJobOrder[] = [
  {
    id: "1",
    jobOrderNo: "JO-2026-0110",
    procurementNo: "PROC/2026/002",
    amount: 245_500,
    dateSubmitted: "2026-06-18",
    stage: "Submitted",
  },
  {
    id: "2",
    jobOrderNo: "JO-2026-0104",
    procurementNo: "PROC/2026/004",
    amount: 189_200,
    dateSubmitted: "2026-06-22",
    stage: "Pending Admin Approval",
  },
  {
    id: "3",
    jobOrderNo: "JO-2026-0098",
    procurementNo: "PROC/2026/001",
    amount: 312_750,
    dateSubmitted: "2026-06-29",
    stage: "Payment Uploaded",
  },
];

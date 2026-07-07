import type { JobOrderHistoryRecord } from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/job-orders?status=completed) once that route exists.
export const jobOrderHistory: JobOrderHistoryRecord[] = [
  {
    id: "1",
    jobOrderNo: "JO-2026-0101",
    procurementNo: "PROC/2026/001",
    completionDate: "2026-02-12",
    originalTotal: 1_245_000,
    finalValue: 1_198_500,
    profit: 86_250,
  },
  {
    id: "2",
    jobOrderNo: "JO-2026-0108",
    procurementNo: "PROC/2026/002",
    completionDate: "2026-03-05",
    originalTotal: 3_860_500,
    finalValue: 3_720_000,
    profit: 214_600,
  },
  {
    id: "3",
    jobOrderNo: "JO-2026-0114",
    procurementNo: "PROC/2026/004",
    completionDate: "2026-04-18",
    originalTotal: 2_140_000,
    finalValue: 2_050_000,
    profit: -32_400,
  },
  {
    id: "4",
    jobOrderNo: "JO-2026-0119",
    procurementNo: "PROC/2026/001",
    completionDate: "2026-05-02",
    originalTotal: 560_750,
    finalValue: 560_750,
    profit: 41_200,
  },
  {
    id: "5",
    jobOrderNo: "JO-2026-0126",
    procurementNo: "PROC/2026/002",
    completionDate: "2026-06-21",
    originalTotal: 4_320_900,
    finalValue: 4_120_000,
    profit: 305_800,
  },
];

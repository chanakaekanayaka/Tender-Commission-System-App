import type { PriceScheduleSummary } from "@/shared/types/tender.types";

// TODO: replace with a real fetch (GET /api/tenders) once that route exists.
export const priceScheduleHistory: PriceScheduleSummary[] = [
  {
    id: "1",
    procurementNo: "PROC/2026/001",
    entity: "Ministry of Health",
    closingDate: "2026-01-15",
    totalValue: 1_245_000,
    status: "Completed",
  },
  {
    id: "2",
    procurementNo: "PROC/2026/002",
    entity: "Road Development Authority",
    closingDate: "2026-02-20",
    totalValue: 3_860_500,
    status: "Completed",
  },
  {
    id: "3",
    procurementNo: "PROC/2026/003",
    entity: "Ministry of Education",
    closingDate: "2026-03-10",
    totalValue: 875_250,
    status: "Draft",
  },
  {
    id: "4",
    procurementNo: "PROC/2026/004",
    entity: "Ceylon Electricity Board",
    closingDate: "2026-04-05",
    totalValue: 2_140_000,
    status: "Completed",
  },
  {
    id: "5",
    procurementNo: "PROC/2026/005",
    entity: "Ministry of Health",
    closingDate: "2026-05-18",
    totalValue: 560_750,
    status: "Draft",
  },
  {
    id: "6",
    procurementNo: "PROC/2026/006",
    entity: "National Water Supply Board",
    closingDate: "2026-06-30",
    totalValue: 4_320_900,
    status: "Draft",
  },
];

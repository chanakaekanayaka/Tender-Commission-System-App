import type {
  JobOrderLineItem,
  ProcurementOption,
  StaffOption,
} from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/tenders?status=completed) once that route exists.
// Only completed Price Schedules are eligible to become a Job Order.
export const procurementOptions: ProcurementOption[] = [
  {
    procurementNo: "PROC/2026/001",
    procurementTitle: "Supply of Office Furniture",
    procuringEntity: "Ministry of Health",
  },
  {
    procurementNo: "PROC/2026/002",
    procurementTitle: "Road Signage & Safety Equipment",
    procuringEntity: "Road Development Authority",
  },
  {
    procurementNo: "PROC/2026/004",
    procurementTitle: "Substation Transformers",
    procuringEntity: "Ceylon Electricity Board",
  },
];

// TODO: replace with a real fetch (GET /api/tenders/[id]/line-items) keyed off the
// selected procurement — this mock stands in for that response.
export const procurementLineItems: Record<string, JobOrderLineItem[]> = {
  "PROC/2026/001": [
    { id: "1", item: "Executive office chair, ergonomic", qty: 25, unitPrice: 18_500 },
    { id: "2", item: "Office desk, 1.5m laminate top", qty: 25, unitPrice: 22_000 },
    { id: "3", item: "Filing cabinet, 4-drawer steel", qty: 10, unitPrice: 15_750 },
  ],
  "PROC/2026/002": [
    { id: "1", item: "Reflective road signs, 600mm triangular", qty: 120, unitPrice: 4_200 },
    { id: "2", item: "Traffic cones, 750mm", qty: 300, unitPrice: 950 },
    { id: "3", item: "Guardrail sections, galvanized steel", qty: 60, unitPrice: 12_800 },
  ],
  "PROC/2026/004": [
    { id: "1", item: "Distribution transformer, 100kVA", qty: 6, unitPrice: 1_250_000 },
    { id: "2", item: "Transformer oil, per 200L drum", qty: 18, unitPrice: 68_000 },
    { id: "3", item: "Cable termination kits", qty: 40, unitPrice: 9_400 },
  ],
};

// TODO: replace with a real fetch (GET /api/users?role=staff) once that route exists.
export const staffOptions: StaffOption[] = [
  { id: "u1", name: "Nadeesha Perera" },
  { id: "u2", name: "Kasun Fernando" },
  { id: "u3", name: "Ishara Wickramasinghe" },
  { id: "u4", name: "Dinuka Rajapaksha" },
];

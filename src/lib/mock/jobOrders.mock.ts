import type {
  JobOrderLineItem,
  JobOrderMetadata,
  ProcurementOption,
  StaffOption,
} from "@/shared/types/job-order.types";

// TODO: replace with a real fetch (GET /api/tenders?status=completed) once that route exists.
// Only completed Price Schedules are eligible to become a Job Order.
export const procurementOptions: ProcurementOption[] = [
  {
    id: "mock-1",
    procurementNo: "PROC/2026/001",
    procurementTitle: "Supply of Office Furniture",
    procuringEntity: "Ministry of Health",
  },
  {
    id: "mock-2",
    procurementNo: "PROC/2026/002",
    procurementTitle: "Road Signage & Safety Equipment",
    procuringEntity: "Road Development Authority",
  },
  {
    id: "mock-4",
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

// TODO: replace with the real OCR/Gemini extraction result (AI_INSTRUCTIONS.md Workflow A)
// keyed off the uploaded Job Order document, once that pipeline exists.
export const jobOrderMetadataByProcurement: Record<string, JobOrderMetadata> = {
  "PROC/2026/001": {
    address: "No. 385, Ward Place, Colombo 07",
    telephone: "011 269 4321",
    email: "procurement@moh.gov.lk",
    note: "Deliver to Central Stores, Ministry of Health.",
  },
  "PROC/2026/002": {
    address: "No. 216, Denzil Kobbekaduwa Mawatha, Battaramulla",
    telephone: "011 288 7654",
    email: "supplies@rda.gov.lk",
    note: "Site handover coordinated with RDA regional office.",
  },
  "PROC/2026/004": {
    address: "No. 50, Sir Chittampalam A Gardiner Mawatha, Colombo 02",
    telephone: "011 232 1856",
    email: "procurement@ceb.lk",
    note: "Requires substation access clearance prior to delivery.",
  },
};

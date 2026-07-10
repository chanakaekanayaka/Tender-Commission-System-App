import type { AdminExpenseRecord, OtherExpenseRecord } from "@/shared/types/other-expense.types";

// TODO: replace with a real fetch (GET /api/other-expenses?userId=...) once that route exists.
export const otherExpenses: OtherExpenseRecord[] = [
  { id: "e1", description: "Site visit fuel & transport", amount: 4_500, date: "2026-06-20", status: "Pending" },
  { id: "e2", description: "Courier — tender documents", amount: 1_200, date: "2026-06-25", status: "Pending" },
  { id: "e3", description: "Printing & binding", amount: 2_800, date: "2026-05-10", status: "Invoiced" },
];

// TODO: replace with a real fetch (GET /api/expenses) once that route exists.
export const adminExpenseHistory: AdminExpenseRecord[] = [
  {
    id: "1",
    jobOrderNo: "JO-2026-0142",
    category: "Site Visit",
    description: "Site visit fuel & transport",
    amount: 4_500,
    date: "2026-06-20",
    status: "Pending",
    receiptFileName: "site-visit-fuel.jpg",
  },
  {
    id: "2",
    jobOrderNo: "JO-2026-0139",
    category: "Courier",
    description: "Courier — tender documents",
    amount: 1_200,
    date: "2026-06-25",
    status: "Approved",
    receiptFileName: "courier-receipt.pdf",
  },
  {
    id: "3",
    jobOrderNo: "JO-2026-0114",
    category: "Printing & Stationery",
    description: "Printing & binding",
    amount: 2_800,
    date: "2026-05-10",
    status: "Approved",
    receiptFileName: "printing-invoice.pdf",
  },
  {
    id: "4",
    jobOrderNo: "JO-2026-0128",
    category: "Transport",
    description: "Delivery of bill documents",
    amount: 3_100,
    date: "2026-06-02",
    status: "Pending",
  },
  {
    id: "5",
    jobOrderNo: "JO-2026-0108",
    category: "Miscellaneous",
    description: "Office supplies for job order file",
    amount: 950,
    date: "2026-05-22",
    status: "Approved",
    receiptFileName: "supplies-bill.jpg",
  },
];

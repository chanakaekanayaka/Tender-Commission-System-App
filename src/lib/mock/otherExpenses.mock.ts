import type { OtherExpenseRecord } from "@/shared/types/other-expense.types";

// TODO: replace with a real fetch (GET /api/other-expenses?userId=...) once that route exists.
export const otherExpenses: OtherExpenseRecord[] = [
  { id: "e1", description: "Site visit fuel & transport", amount: 4_500, date: "2026-06-20", status: "Pending" },
  { id: "e2", description: "Courier — tender documents", amount: 1_200, date: "2026-06-25", status: "Pending" },
  { id: "e3", description: "Printing & binding", amount: 2_800, date: "2026-05-10", status: "Invoiced" },
];

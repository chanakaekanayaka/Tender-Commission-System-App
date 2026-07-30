import type { OtherExpenseRecord } from "@/shared/types/other-expense.types";

// Other Expenses' own Pending/History (both roles) are real data now (see the respective
// page.tsx files) — this one export remains because Staff's Generate Invoice page still mocks
// its "pending expenses to invoice" picker.
// TODO: replace with real data once Invoices is wired up for real.
export const otherExpenses: OtherExpenseRecord[] = [
  { id: "e1", description: "Site visit fuel & transport", amount: 4_500, date: "2026-06-20", status: "Pending" },
  { id: "e2", description: "Courier — tender documents", amount: 1_200, date: "2026-06-25", status: "Pending" },
  { id: "e3", description: "Printing & binding", amount: 2_800, date: "2026-05-10", status: "Invoiced" },
];

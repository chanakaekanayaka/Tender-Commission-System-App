export type OtherExpenseStatus = "Pending" | "Invoiced";

/** A standalone, staff-recorded expense — distinct from the ad-hoc line items entered inline during Job Order creation (job-order.types.ts's OtherExpenseItem). "Pending" ones are selectable when generating an invoice; picking one flips it to "Invoiced". */
export interface OtherExpenseRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: OtherExpenseStatus;
  receiptFileName?: string;
}

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Printing & Stationery",
  "Courier",
  "Site Visit",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type AdminExpenseStatus = "Approved" | "Pending";

/** Admin's Other Expenses record — a job-order-linked expense (distinct from the staff-recorded, invoice-bound OtherExpenseRecord above), tracked through an Approve/Pending review state. */
export interface AdminExpenseRecord {
  id: string;
  jobOrderNo: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  status: AdminExpenseStatus;
  receiptFileName?: string;
}

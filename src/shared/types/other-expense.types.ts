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

/** Review status for the real, isolated "Other Expenses" reimbursement flow (Staff submits, Admin
 *  approves/rejects) — distinct from `OtherExpenseStatus` above, which belongs to the still-mock
 *  Invoices feature. */
export type ExpenseReviewStatus = "Pending" | "Approved" | "Rejected";

/** Staff's own Pending Expenses row — their submission awaiting Admin's decision. */
export interface StaffExpensePendingRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  receiptFileName?: string;
  /** MIME type — drives DocumentPreviewModal's image/PDF rendering. Only present alongside `receiptFileName`. */
  receiptFileType?: string;
  receiptUrl?: string;
}

/** Staff's own Expense History row — already reviewed (Approved or Rejected). */
export interface StaffExpenseHistoryRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: "Approved" | "Rejected";
  receiptFileName?: string;
  receiptFileType?: string;
  receiptUrl?: string;
  reviewedDate: string;
}

/** Admin's Pending Expenses row — every Staff-submitted expense awaiting Approve/Reject. */
export interface AdminExpensePendingRecord {
  id: string;
  staffName: string;
  description: string;
  amount: number;
  date: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptUrl?: string;
}

/** Admin's Expense History row — already reviewed (Approved or Rejected). */
export interface AdminExpenseHistoryRecord {
  id: string;
  staffName: string;
  description: string;
  amount: number;
  date: string;
  status: "Approved" | "Rejected";
  receiptFileName?: string;
  receiptFileType?: string;
  receiptUrl?: string;
  reviewedDate: string;
}

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

/** Staff's own Pending Expenses row — covers two stages, same as Admin's own pending row (see
 *  `AdminExpensePendingRecord`): `paymentProof*`/`paymentUploadedAt` are all undefined while
 *  awaiting Admin's decision (nothing to confirm yet), and populated once Admin approves and
 *  uploads a receipt — only then is PATCH confirm-payment actually reachable. Or already bundled
 *  into an invoice awaiting that invoice's own resolution. */
export interface StaffExpensePendingRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  receiptFileName?: string;
  /** MIME type — drives DocumentPreviewModal's image/PDF rendering. Only present alongside `receiptFileName`. */
  receiptFileType?: string;
  receiptUrl?: string;
  paymentProofFileName?: string;
  paymentProofFileType?: string;
  /** Signed, short-lived S3 URL for Admin's uploaded payment receipt — undefined until Admin approves. */
  paymentProofUrl?: string;
  /** Formatted "YYYY-MM-DD HH:MM" in Sri Lanka local time (see `formatDateTime`) — undefined until
   *  Admin approves. */
  paymentUploadedAt?: string;
}

/** Staff's own Expense History row — already reviewed (Approved or Rejected). Payment receipt
 *  fields are only present for Approved rows — Rejected ones never had a reimbursement paid out. */
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
  paymentProofFileName?: string;
  paymentProofFileType?: string;
  paymentProofUrl?: string;
  paymentUploadedAt?: string;
  /** Set only when this expense was settled by bundling it into an Invoice (see
   *  `OtherExpense.invoiceId`) rather than approved individually — lets Staff trace which invoice
   *  covered it. */
  invoiceNo?: string;
}

/**
 * Admin's Pending Expenses row — every Staff-submitted expense not yet confirmed by Staff (that
 * hasn't already been bundled into an invoice), covering two stages in one table:
 * `awaitingStaffConfirmation: false` means Upload/Reject are still live (Admin hasn't approved
 * yet); `true` means Admin already approved and uploaded a payment receipt, so those actions are
 * replaced with a read-only "awaiting Staff" indicator until Staff confirms via confirm-payment
 * and the row leaves for History.
 */
export interface AdminExpensePendingRecord {
  id: string;
  staffName: string;
  description: string;
  amount: number;
  date: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptUrl?: string;
  awaitingStaffConfirmation: boolean;
  paymentProofFileName?: string;
  paymentProofFileType?: string;
  paymentProofUrl?: string;
  paymentUploadedAt?: string;
}

/** Admin's Expense History row — already reviewed (Approved or Rejected). Payment receipt fields
 *  are only present for Approved rows — Rejected ones never had a reimbursement paid out. */
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
  paymentProofFileName?: string;
  paymentProofFileType?: string;
  paymentProofUrl?: string;
  paymentUploadedAt?: string;
  /** Set only when this expense was settled by bundling it into an Invoice (see
   *  `OtherExpense.invoiceId`) rather than approved individually — lets Admin trace which invoice
   *  covered it. */
  invoiceNo?: string;
}

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

export type InvoiceStatus = "Pending Review" | "Paid";

export interface InvoiceLineItem {
  id: string;
  type: "commission" | "expense";
  label: string;
  amount: number;
}

export interface InvoiceRequest {
  id: string;
  invoiceNo: string;
  /** Stand-in for a real session's user — no auth yet (AGENTS.md UI-only mock phase). */
  submittedBy: string;
  submittedDate: string;
  items: InvoiceLineItem[];
  total: number;
  status: InvoiceStatus;
  /** Admin's lightweight "reviewed" acknowledgment — independent of the Paid transition, which only Upload triggers. */
  verified: boolean;
  /** Set once Admin uploads the final payment bill — the moment status flips to "Paid". */
  paymentBillFileName?: string;
}

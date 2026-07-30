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
  submittedBy: string;
  submittedDate: string;
  items: InvoiceLineItem[];
  total: number;
  status: InvoiceStatus;
  /** Set once Admin uploads the payment bill — the moment status flips to "Paid". */
  paymentBillFileName?: string;
  paymentBillFileType?: string;
  /** Signed, short-lived S3 URL — only present alongside `paymentBillFileName`. */
  paymentBillUrl?: string;
}

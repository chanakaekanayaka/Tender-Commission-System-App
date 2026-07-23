import type { PriceScheduleLineItem } from "@/shared/types/tender.types";

export type JobOrderLineItem = PriceScheduleLineItem;

export interface OtherExpenseItem {
  id: string;
  label: string;
  amount: number;
}

/** Which side of a value/percentage pair the user last typed into — the other side is always derived from this. */
export type AmountInputMode = "value" | "percentage";

/** Auto-filled by the Step 1 "Parse" action — read-only in the UI. */
export interface JobOrderMetadata {
  address: string;
  telephone: string;
  email: string;
  note: string;
}

/** A single uploaded receipt in Step 2 — `amount` is entered/edited by the user next to the file. */
export interface ReceiptItem {
  id: string;
  fileName: string;
  amount: number;
  /** MIME type of the uploaded File — drives which preview renderer the modal picks. */
  fileType: string;
  /** `URL.createObjectURL(file)` — a real, in-browser preview of what was actually uploaded (this is genuine user file data, unlike the mock document names elsewhere in Job Orders). Must be revoked when the receipt is removed or replaced. */
  previewUrl: string;
  /** S3 key once the real upload (POST /api/job-orders/receipts) finishes — `null` while uploading
   *  or if the upload failed. This is what actually persists; `previewUrl` never leaves the browser. */
  s3Key: string | null;
  isUploading: boolean;
  uploadError?: string;
}

export interface StaffOption {
  id: string;
  name: string;
}

export interface ProcurementOption {
  /** The linked Price Schedule's Mongo id — used to fetch its full line items on selection. */
  id: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
}

/** Staff's Active Job Orders — tracks creation-wizard progress (Step 1/2/3), same axis as AdminActiveJobOrder. */
export interface ActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  completedStep: JobOrderCompletionStep;
  documentName?: string;
  /** Signed, short-lived S3 URL for the generated bill — only present alongside `documentName`. */
  documentUrl?: string;
}

export interface JobOrderHistoryRecord {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  completionDate: string;
  originalTotal: number;
  finalValue: number;
  profit: number;
}

/** How far a job order has progressed through the 3-step creation wizard (Step 1: Create Job Order, Step 2: Receipts Uploads, Step 3: Markup & Summary). Drives Admin's Active table status badge and gates "Generate Bill". */
export type JobOrderCompletionStep = 1 | 2 | 3;

/**
 * Admin's Active Job Orders row — same `completedStep` axis as Staff's own
 * `ActiveJobOrder`, since both track the one shared creation wizard, just
 * viewed from each role's own list. `documentName` is whatever bill document
 * Staff has attached, shown read-only via the same document cell.
 */
export interface AdminActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  completedStep: JobOrderCompletionStep;
  documentName?: string;
  /** Signed, short-lived S3 URL for the generated bill — only present alongside `documentName`. */
  documentUrl?: string;
}

/** Admin's Pending Job Orders row — the bill has been generated and is awaiting payment from the procuring entity. */
export interface AdminPendingJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  billAmount: number;
  billGeneratedDate: string;
  /** From the job order's own Step 1 metadata — feeds the payment reminder letter/email. */
  entityAddress: string;
  entityEmail: string;
}

/** Staff's Pending Job Orders row — read-only: bills already generated, awaiting Admin's payment verification. */
export interface StaffPendingJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  amount: number;
  dateSubmitted: string;
}

/**
 * Full detail record for the Staff Dashboard's Job Order Detail Modal — combines the
 * metadata/line-items already modeled elsewhere with the financial-summary figures
 * (commission, other expenses) that otherwise only exist as transient wizard state.
 * `originalTotal` is deliberately not stored here — it's derived from `lineItems` via
 * `calculateLineItemTotals`, same as everywhere else line-item totals are shown.
 */
export interface JobOrderDetail {
  jobOrderNo: string;
  procurementNo: string;
  metadata: JobOrderMetadata;
  lineItems: JobOrderLineItem[];
  commissionValue: number;
  otherExpensesTotal: number;
  documentName?: string;
}

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

/** Step 1's own Source Document — real upload only for now (POST /api/job-orders/source-document);
 *  no OCR/parsing wired up yet, so this never drives the Metadata fields (those stay manual). */
export interface SourceDocumentState {
  fileName: string;
  fileType: string;
  /** S3 key once the real upload finishes — `null` while uploading or if the upload failed. */
  s3Key: string | null;
  /** ISO timestamp captured client-side the moment the upload actually succeeds — set alongside s3Key. */
  uploadedAt?: string;
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

/** Staff's Active Job Orders — same underlying record as AdminActiveJobOrder, viewed from Staff's
 *  own role: Commission (their own profit share) instead of Admin's Profit, and no Action column. */
export interface ActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  total: number;
  /** Staff's own profit share — `JobOrder.commissionValue`, live (not frozen until billing). */
  commissionValue: number;
  /** Whether the generated bill has been sent to Admin (`JobOrder.billSubmittedAt !== null`) —
   *  drives the "Job Pending" → "Verification Pending" status badge, and whether Staff still sees
   *  a "Send to Admin" button or is just waiting on Admin's Verify action. */
  billSubmitted: boolean;
  /** Only "Completed" once the wizard's own Create Job Order (validated, requires Markup > 0) has
   *  actually run — a Save Draft on Step 3 still leaves this "Draft" even though completedStep is
   *  already 3, so Generate Bill gating checks this, not completedStep alone. */
  status: "Draft" | "Completed";
  createdAt: string;
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
  /** Step 2 receipts + manual Other Expenses total — what actually went to/was spent by Staff on
   *  this job (same figure Active/Pending show), not the entity's bill amount. Identical for both
   *  roles — see `getExpensesAmount`. */
  finalValue: number;
  /** Role-contextual: the page building this record plugs in the company's profit (Admin,
   *  `JobOrder.profit`, frozen at bill generation) or the Staff member's own profit share
   *  (`JobOrder.commissionValue`) — this type itself doesn't know which. */
  profit: number;
}

/** How far a job order has progressed through the 3-step creation wizard (Step 1: Create Job Order, Step 2: Receipts Uploads, Step 3: Markup & Summary). Drives Admin's Active table status badge and gates "Generate Bill". */
export type JobOrderCompletionStep = 1 | 2 | 3;

/** A single Other Expenses row shown in Admin's review Details modal — combines both Step 2
 *  receipts (label: the uploaded file's name) and manually-entered expense lines into one shape.
 *  Only receipt rows carry `fileUrl`/`fileType` (a real uploaded file behind them); manual entries
 *  are amount-only and stay plain text in the UI. */
export interface JobOrderExpenseBreakdownItem {
  label: string;
  amount: number;
  /** Signed, short-lived S3 URL for the receipt file — only present for receipt-derived rows. */
  fileUrl?: string;
  fileType?: string;
}

/**
 * Admin's Active Job Orders row — same underlying record as Staff's own `ActiveJobOrder`, just
 * viewed from Admin's role: Profit (the company's own share) instead of Staff's Commission, plus
 * the Admin-only Action (Regenerate Bill, Verify) column and review Details modal.
 */
export interface AdminActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  procuringEntity: string;
  total: number;
  /** Company's own profit share — `JobOrder.markupValue`, live (not frozen until billing). */
  profit: number;
  /** What the generated bill actually charges the procuring entity — `JobOrder.billAmount`, null
   *  until a bill exists. Shown in the Details review modal alongside the expense breakdown. */
  billAmount: number | null;
  /** Receipts + manual expense entries Staff recorded in Step 2 — same figures that make up
   *  `total`'s underlying profit base, surfaced here so Admin can review them before verifying. */
  otherExpenses: JobOrderExpenseBreakdownItem[];
  otherExpensesTotal: number;
  /** Whether the generated bill has been sent to Admin (`JobOrder.billSubmittedAt !== null`) —
   *  Admin generating/regenerating the bill themselves sets this immediately, so this only ever
   *  reads `false` for a bill Staff generated but hasn't sent yet. Drives the "Job Pending" →
   *  "Verification Pending" status badge, and whether the Verify action is available. */
  billSubmitted: boolean;
  /** Only "Completed" once the wizard's own Create Job Order (validated, requires Markup > 0) has
   *  actually run — a Save Draft on Step 3 still leaves this "Draft" even though completedStep is
   *  already 3, so Generate Bill gating checks this, not completedStep alone. */
  status: "Draft" | "Completed";
  createdAt: string;
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
  /** What the procuring entity actually owes — feeds the payment reminder email/letter only; the
   *  "Amount" column itself shows `expensesAmount` instead (see below). */
  billAmount: number;
  /** Step 2 receipts + manual Other Expenses total — what actually went to/was spent by the Staff
   *  member on this job, same figure Job Order Active's Details modal shows. This is what the
   *  Pending table's own "Amount" column displays (not `billAmount`). */
  expensesAmount: number;
  billGeneratedDate: string;
  /** From the job order's own Step 1 metadata — feeds the payment reminder letter/email. */
  entityAddress: string;
  entityEmail: string;
  /** Evidence Staff uploaded that the entity actually paid — undefined until they do. */
  paymentProofName?: string;
  paymentProofType?: string;
  /** Signed, short-lived S3 URL — only present alongside `paymentProofName`. */
  paymentProofUrl?: string;
  /** Whether Admin has confirmed the uploaded proof looks legitimate (`paymentProofVerifiedAt`) —
   *  the row stays in Pending either way, shown as "Verified" once true. Only once true can Admin
   *  use the separate "Payment Complete" action, which is what actually moves it to History. */
  paymentProofVerified: boolean;
}

/** Staff's Pending Job Orders row — bills already generated, awaiting Admin's payment verification.
 *  Staff's one action here is uploading proof once the entity actually pays. */
export interface StaffPendingJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  /** Step 2 receipts + manual Other Expenses total — what actually went to/was spent by Staff on
   *  this job, same figure Job Order Active's Details modal shows (not the entity's bill amount). */
  amount: number;
  dateSubmitted: string;
  paymentProofName?: string;
  paymentProofType?: string;
  /** Signed, short-lived S3 URL — only present alongside `paymentProofName`. */
  paymentProofUrl?: string;
  /** Whether Admin has confirmed the uploaded proof looks legitimate — read-only status for Staff,
   *  shown as "Verified"; the final "Payment Complete" step is Admin-only. */
  paymentProofVerified: boolean;
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

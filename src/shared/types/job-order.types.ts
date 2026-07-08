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
}

export interface StaffOption {
  id: string;
  name: string;
}

export interface ProcurementOption {
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
}

// Pending = created, no bill document yet. Bill Created = Staff uploaded the
// document. Verified = Admin has reviewed and signed off.
export type JobOrderStatus = "Pending" | "Bill Created" | "Verified";

export interface ActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  status: JobOrderStatus;
  documentName?: string;
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
 * Admin's Active Job Orders row — tracks wizard progress, a different axis
 * from Staff's `ActiveJobOrder` (which tracks the separate bill-document
 * upload/verify workflow). `documentName` here is still whatever bill
 * document Staff has attached, shown read-only via the same document cell.
 */
export interface AdminActiveJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  completedStep: JobOrderCompletionStep;
  documentName?: string;
}

/** Admin's Pending Job Orders row — the bill has been generated and is awaiting payment from the procuring entity. */
export interface AdminPendingJobOrder {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  billAmount: number;
  billGeneratedDate: string;
}

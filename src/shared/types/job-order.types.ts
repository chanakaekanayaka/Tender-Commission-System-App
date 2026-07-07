import type { PriceScheduleLineItem } from "@/shared/types/tender.types";

export type JobOrderLineItem = PriceScheduleLineItem;

export interface OtherExpenseItem {
  id: string;
  label: string;
  amount: number;
}

/** Which side of a value/percentage pair the user last typed into — the other side is always derived from this. */
export type AmountInputMode = "value" | "percentage";

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

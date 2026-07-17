export interface PriceScheduleLineItem {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
}

export interface PriceScheduleMetadata {
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  closingDate: string;
  uploadingDate: string;
}

export type PriceScheduleStatus = "Completed" | "Draft";

export interface PriceScheduleSummary {
  id: string;
  procurementNo: string;
  entity: string;
  closingDate: string;
  totalValue: number;
  status: PriceScheduleStatus;
}

export interface PriceScheduleSourceDocument {
  s3Key: string;
  fileName: string;
}

/** Full record — superset of PriceScheduleSummary, used by the create/detail flows. */
export interface PriceSchedule {
  id: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  closingDate: string;
  uploadingDate: string;
  lineItems: PriceScheduleLineItem[];
  subTotal: number;
  vatAmount: number;
  totalValue: number;
  status: PriceScheduleStatus;
  sourceDocument?: PriceScheduleSourceDocument;
  createdBy: string;
}

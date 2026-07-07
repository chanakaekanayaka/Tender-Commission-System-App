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

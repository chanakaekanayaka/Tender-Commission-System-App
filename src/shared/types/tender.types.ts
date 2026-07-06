export interface PriceScheduleLineItem {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
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

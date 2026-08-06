export type VendorExcelUploadStatus = "Pending" | "Linked";

export interface VendorExcelItemRow {
  itemNo?: number;
  description: string;
  qty: number;
  unit: string;
  unitPriceExclVat: number;
  transport: number;
  subTotal: number;
  discount: number;
  priceWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface VendorExcelVendorBlock {
  vendorName: string;
  isOurVendor: boolean;
  items: VendorExcelItemRow[];
}

export interface VendorExcelUploadSummary {
  id: string;
  fileName: string;
  procurementNo?: string;
  status: VendorExcelUploadStatus;
  /** Explicit review gate — only confirmed uploads feed Market Analysis (see getTenderMarketComparisons). */
  confirmed: boolean;
  vendorCount: number;
  uploadedAt: string;
}

export interface VendorExcelUploadDetail extends VendorExcelUploadSummary {
  vendorBlocks: VendorExcelVendorBlock[];
}

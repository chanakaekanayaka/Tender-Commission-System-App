export type TenderWinStatus = "Won" | "Lost" | "Unknown";

export interface TenderVendorPrice {
  vendorName: string;
  /** null when this vendor's Excel didn't quote this particular item. */
  price: number | null;
}

export interface TenderComparisonItem {
  itemName: string;
  qty: number;
  /** null when our own vendor block wasn't found in this Excel (System Config's companyName
   *  didn't match any vendor name in it). */
  ourPrice: number | null;
  otherPrices: TenderVendorPrice[];
}

export interface TenderMarketComparison {
  uploadId: string;
  fileName: string;
  uploadedAt: string;
  /** Only present once this upload has been linked to a Price Schedule — purely informational
   *  here, not required for the comparison itself (everything else comes from the Excel alone). */
  procurementNo?: string;
  /** "Won" when our total is the lowest of every vendor's total in this Excel, "Lost" when it
   *  isn't, "Unknown" when our own vendor block couldn't be identified at all. */
  status: TenderWinStatus;
  vendorNames: string[];
  /** Same order as vendorNames — each vendor's grand total (sum of their quoted items' Total
   *  Price incl. VAT), for the totals footer row. */
  vendorTotals: number[];
  items: TenderComparisonItem[];
  ourTotal: number | null;
  lowestOtherTotal: number | null;
}

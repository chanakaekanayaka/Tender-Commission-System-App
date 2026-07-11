export interface ItemSpec {
  id: string;
  label: string;
  value: string;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  specs: ItemSpec[];
}

export interface MarketAnalysisEntry {
  id: string;
  itemName: string;
  ourBiddingPrices: number[];
  othersLowestPrices: number[];
  suppliedQty: number;
  bidQty: number;
}

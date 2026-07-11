import type { CatalogItem, MarketAnalysisEntry } from "@/shared/types/item.types";

// TODO: replace with a real fetch (GET /api/items) once that route exists.
export const catalogItems: CatalogItem[] = [
  {
    id: "1",
    code: "ITM-0001",
    name: "Tennis Ball",
    imageUrl: "",
    specs: [
      { id: "1-1", label: "Size", value: "6.7 cm" },
      { id: "1-2", label: "Weight", value: "58 g" },
      { id: "1-3", label: "Brand", value: "Cool Brand" },
    ],
  },
  {
    id: "2",
    code: "ITM-0002",
    name: "Cricket Bat",
    imageUrl: "",
    specs: [
      { id: "2-1", label: "Size", value: "86 cm" },
      { id: "2-2", label: "Weight", value: "1180 g" },
      { id: "2-3", label: "Brand", value: "Cool Brand" },
    ],
  },
  {
    id: "3",
    code: "ITM-0003",
    name: "PCB Board",
    imageUrl: "",
    specs: [
      { id: "3-1", label: "Size", value: "50 cm" },
      { id: "3-2", label: "Weight", value: "45 g" },
      { id: "3-3", label: "Brand", value: "Cool Brand" },
    ],
  },
];

// TODO: replace with a real fetch (GET /api/items/market-analysis) once that route exists.
export const marketAnalysisData: MarketAnalysisEntry[] = [
  {
    id: "1",
    itemName: "PCB Board",
    ourBiddingPrices: [3500, 8000, 9000],
    othersLowestPrices: [1200, 1500, 600],
    suppliedQty: 5,
    bidQty: 19,
  },
  {
    id: "2",
    itemName: "Tennis Ball",
    ourBiddingPrices: [450, 480],
    othersLowestPrices: [400, 420],
    suppliedQty: 120,
    bidQty: 150,
  },
  {
    id: "3",
    itemName: "Cricket Bat",
    ourBiddingPrices: [12_500],
    othersLowestPrices: [11_800],
    suppliedQty: 8,
    bidQty: 10,
  },
];

import type { MarketAnalysisEntry } from "@/shared/types/item.types";

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

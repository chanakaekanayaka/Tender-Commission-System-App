import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import {
  VendorExcelUploadModel,
  type VendorExcelBlockSubdoc,
  type VendorExcelItemSubdoc,
} from "@/lib/db/models/VendorExcelUpload.model";
import { isOurVendor } from "@/lib/utils/vendorMatch";
import { formatDateTime } from "@/lib/utils/date";
import type { TenderComparisonItem, TenderMarketComparison, TenderWinStatus } from "@/shared/types/marketAnalysis.types";

function normalizedKey(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}

function blockTotal(block: VendorExcelBlockSubdoc | undefined): number | null {
  if (!block) return null;
  return block.items.reduce((sum: number, item: VendorExcelItemSubdoc) => sum + item.totalWithVat, 0);
}

export interface MarketAnalysisPage {
  comparisons: TenderMarketComparison[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Only *confirmed* vendor comparison Excel uploads feed Market Analysis — confirming (Pending
 * Excel Uploads' own "Confirm" action) is an explicit review gate, not automatic on upload, so a
 * bad parse never silently shows up here. No Price Schedule link required. The Excel alone already
 * has everything needed: every vendor's price per item and (via totals) whether we actually won.
 * Our own vendor block is identified by matching System Config's companyName against the vendor
 * names in the Excel (see isOurVendor); "Won" means our total was the lowest of every vendor's
 * total in that Excel, "Lost" means it wasn't, "Unknown" means our own block couldn't be found in
 * it at all (companyName unset, or doesn't match).
 *
 * Paginated at the Mongo query level (skip/limit before building comparisons) — these are big,
 * full-detail cards, not table rows, so there's no reason to build ones off-page.
 */
export async function getTenderMarketComparisons(page: number, limit: number): Promise<MarketAnalysisPage> {
  const [systemConfig, total] = await Promise.all([
    getOrCreateSystemConfig(),
    VendorExcelUploadModel.countDocuments({ confirmed: true }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const uploads = await VendorExcelUploadModel.find({ confirmed: true })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit);

  const comparisons = uploads.map((upload) => {
    const ourBlock: VendorExcelBlockSubdoc | undefined = upload.vendorBlocks.find(
      (block: VendorExcelBlockSubdoc) => isOurVendor(block.vendorName, systemConfig.companyName),
    );
    const otherBlocks: VendorExcelBlockSubdoc[] = upload.vendorBlocks.filter(
      (block: VendorExcelBlockSubdoc) => block !== ourBlock,
    );
    // The item list every vendor quoted against — prefer our own block's item order/qty, falling
    // back to the first vendor's if ours wasn't found, since every block quotes the same items.
    const baseBlock: VendorExcelBlockSubdoc | undefined = ourBlock ?? upload.vendorBlocks[0];

    const items: TenderComparisonItem[] = (baseBlock?.items ?? []).map((baseItem: VendorExcelItemSubdoc) => {
      const key = normalizedKey(baseItem.description);
      const ourItem = ourBlock?.items.find((item: VendorExcelItemSubdoc) => normalizedKey(item.description) === key);
      const otherPrices = otherBlocks.map((block) => {
        const match = block.items.find((item: VendorExcelItemSubdoc) => normalizedKey(item.description) === key);
        return { vendorName: block.vendorName, price: match ? match.unitPriceExclVat : null };
      });
      return {
        itemName: baseItem.description,
        qty: baseItem.qty,
        ourPrice: ourItem ? ourItem.unitPriceExclVat : null,
        otherPrices,
      };
    });

    const ourTotal = blockTotal(ourBlock);
    const otherTotals = otherBlocks.map((block) => blockTotal(block)).filter((t): t is number => t !== null);
    const lowestOtherTotal = otherTotals.length > 0 ? Math.min(...otherTotals) : null;

    let status: TenderWinStatus = "Unknown";
    if (ourTotal !== null) {
      status = lowestOtherTotal === null || ourTotal <= lowestOtherTotal ? "Won" : "Lost";
    }

    return {
      uploadId: upload._id.toString(),
      fileName: upload.sourceDocument.fileName,
      uploadedAt: formatDateTime(upload.createdAt),
      procurementNo: upload.procurementNo,
      status,
      vendorNames: otherBlocks.map((block) => block.vendorName),
      vendorTotals: otherBlocks.map((block) => blockTotal(block) ?? 0),
      items,
      ourTotal,
      lowestOtherTotal,
    };
  });

  return { comparisons, total, page: currentPage, totalPages };
}

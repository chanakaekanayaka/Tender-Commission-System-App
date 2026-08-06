import ExcelJS from "exceljs";

export interface ParsedVendorItem {
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

export interface ParsedVendorBlock {
  vendorName: string;
  items: ParsedVendorItem[];
}

export class VendorExcelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorExcelParseError";
  }
}

/** exceljs's `cell.text` getter throws internally (not just returns empty) for some cell kinds —
 *  a formula that resolved to an error (#REF!, #DIV/0!), a rich-text run with a null value, a
 *  hyperlink with no display text. Never let one bad cell abort parsing the whole sheet; fall back
 *  to a plain String(value) or "" on the raw cell value instead of leaking the internal crash. */
function safeCellText(cell: ExcelJS.Cell): string {
  try {
    return cell.text?.trim() ?? "";
  } catch {
    try {
      const value = cell.value;
      return value === null || value === undefined ? "" : String(value).trim();
    } catch {
      return "";
    }
  }
}

/** Non-master cells in a merge (e.g. a vendor name spanning several item rows) come back empty —
 *  fall back to the merge's master cell so every row in the block still resolves the vendor name. */
function resolveMergedText(cell: ExcelJS.Cell): string {
  const own = safeCellText(cell);
  if (own) return own;
  if (cell.isMerged && cell.master !== cell) return safeCellText(cell.master);
  return "";
}

function cellNumber(cell: ExcelJS.Cell | undefined): number {
  if (!cell) return 0;
  try {
    const raw = cell.value;
    if (typeof raw === "number") return raw;
  } catch {
    // fall through to text-based parsing below
  }
  const parsed = parseFloat(safeCellText(cell).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

interface ColumnMap {
  vendor: number;
  itemNo?: number;
  description: number;
  qty?: number;
  unit?: number;
  unitPriceExclVat?: number;
  transport?: number;
  subTotal?: number;
  discount?: number;
  priceWithoutVat?: number;
  vatAmount?: number;
  totalWithVat?: number;
}

// Order matters within each list — more specific phrases are checked by the caller before the
// generic fallback keyword ("without vat" before a bare "vat"), same heuristic as
// src/lib/aws/textract.ts's HEADER_HINT_KEYWORDS/findColumn.
const COLUMN_KEYWORDS: { field: keyof ColumnMap; keywords: string[] }[] = [
  { field: "vendor", keywords: ["vendor", "supplier"] },
  { field: "description", keywords: ["description"] },
  { field: "itemNo", keywords: ["item no", "item number", "sl no", "s.no"] },
  { field: "qty", keywords: ["quantity", "qty"] },
  { field: "priceWithoutVat", keywords: ["without vat"] },
  { field: "unitPriceExclVat", keywords: ["unit price"] },
  { field: "transport", keywords: ["transport"] },
  { field: "subTotal", keywords: ["sub total", "subtotal"] },
  { field: "discount", keywords: ["discount"] },
  { field: "vatAmount", keywords: ["vat"] },
  { field: "totalWithVat", keywords: ["total price", "total with vat", "total"] },
  { field: "unit", keywords: ["unit"] },
];

function scoreHeaderRow(row: ExcelJS.Row, maxCol: number): number {
  let score = 0;
  for (let col = 1; col <= maxCol; col++) {
    const text = safeCellText(row.getCell(col)).toLowerCase();
    if (!text) continue;
    if (COLUMN_KEYWORDS.some(({ keywords }) => keywords.some((kw) => text.includes(kw)))) score += 1;
  }
  return score;
}

function buildColumnMap(row: ExcelJS.Row, maxCol: number): ColumnMap | null {
  const used = new Set<number>();
  const map: Partial<ColumnMap> = {};

  for (const { field, keywords } of COLUMN_KEYWORDS) {
    for (let col = 1; col <= maxCol; col++) {
      if (used.has(col)) continue;
      const text = safeCellText(row.getCell(col)).toLowerCase();
      if (keywords.some((kw) => text.includes(kw))) {
        map[field] = col;
        used.add(col);
        break;
      }
    }
  }

  if (map.vendor === undefined || map.description === undefined) return null;
  return map as ColumnMap;
}

const HEADER_SCAN_ROWS = 10;

/** Best-effort vendor-comparison Excel -> vendor blocks extraction. Every vendor quotes against
 *  the same item list, so items are grouped by vendor purely by reading top-to-bottom: a non-blank
 *  (possibly merged) vendor-name cell starts a new block, and any row with a non-blank description
 *  belongs to whichever block is currently open — this naturally skips blank spacer rows and each
 *  vendor's own subtotal-only row (no description). Inherently heuristic, like the PDF/Textract
 *  line-item extraction this mirrors; re-upload with a corrected file if parsing looks wrong. */
export async function parseVendorComparisonWorkbook(buffer: Buffer): Promise<ParsedVendorBlock[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's own .d.ts declares a private ArrayBuffer-shaped `Buffer` type that shadows Node's
    // — a Node Buffer works fine at runtime, it just needs this cast to satisfy that structural type.
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    // exceljs throws its own low-level errors (e.g. "zip file is empty") for a corrupt or
    // non-Excel file — surfaced as a clean, user-facing message instead of a raw parser error.
    throw new VendorExcelParseError("This doesn't look like a valid Excel file.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new VendorExcelParseError("This file has no worksheet to read.");
  }

  const maxCol = sheet.columnCount || sheet.actualColumnCount || 20;

  let headerRowNumber = -1;
  let bestScore = 0;
  const rowsToScan = Math.min(HEADER_SCAN_ROWS, sheet.rowCount);
  for (let r = 1; r <= rowsToScan; r++) {
    const score = scoreHeaderRow(sheet.getRow(r), maxCol);
    if (score > bestScore) {
      bestScore = score;
      headerRowNumber = r;
    }
  }

  if (headerRowNumber === -1) {
    throw new VendorExcelParseError("Could not detect the comparison table headers in this file.");
  }

  const columns = buildColumnMap(sheet.getRow(headerRowNumber), maxCol);
  if (!columns) {
    throw new VendorExcelParseError("Could not detect the Vendor/Description columns in this file.");
  }

  const blocks: ParsedVendorBlock[] = [];
  let currentVendorName: string | null = null;
  let currentItems: ParsedVendorItem[] = [];

  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);

    const vendorText = resolveMergedText(row.getCell(columns.vendor));
    if (vendorText && vendorText !== currentVendorName) {
      currentVendorName = vendorText;
      currentItems = [];
      blocks.push({ vendorName: currentVendorName, items: currentItems });
    }

    const description = safeCellText(row.getCell(columns.description));
    if (!description || currentVendorName === null) continue;

    currentItems.push({
      itemNo: columns.itemNo ? cellNumber(row.getCell(columns.itemNo)) : undefined,
      description,
      qty: columns.qty ? cellNumber(row.getCell(columns.qty)) : 0,
      unit: columns.unit ? safeCellText(row.getCell(columns.unit)) : "",
      unitPriceExclVat: columns.unitPriceExclVat ? cellNumber(row.getCell(columns.unitPriceExclVat)) : 0,
      transport: columns.transport ? cellNumber(row.getCell(columns.transport)) : 0,
      subTotal: columns.subTotal ? cellNumber(row.getCell(columns.subTotal)) : 0,
      discount: columns.discount ? cellNumber(row.getCell(columns.discount)) : 0,
      priceWithoutVat: columns.priceWithoutVat ? cellNumber(row.getCell(columns.priceWithoutVat)) : 0,
      vatAmount: columns.vatAmount ? cellNumber(row.getCell(columns.vatAmount)) : 0,
      totalWithVat: columns.totalWithVat ? cellNumber(row.getCell(columns.totalWithVat)) : 0,
    });
  }

  const nonEmptyBlocks = blocks.filter((b) => b.items.length > 0);
  if (nonEmptyBlocks.length === 0) {
    throw new VendorExcelParseError("No vendor price data could be extracted from this file.");
  }

  return nonEmptyBlocks;
}

import {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  type Block,
} from "@aws-sdk/client-textract";
import type { PriceScheduleLineItem, PriceScheduleMetadata } from "@/shared/types/tender.types";

// No explicit credentials — same reasoning as s3.ts: the SDK's default credential provider
// chain picks up the Amplify Hosting SSR compute role in production, or `aws configure`
// credentials locally.
let cachedClient: TextractClient | null = null;

function getTextractClient(): TextractClient {
  if (!cachedClient) {
    cachedClient = new TextractClient({ region: process.env.AWS_REGION });
  }
  return cachedClient;
}

/** Starts async table analysis on an S3 object. TABLES only (not FORMS/QUERIES) — cheapest tier that
 *  still gets structured table extraction; metadata fields are recovered separately from the same
 *  response's plain-text LINE blocks via extractMetadataFromLines, at no extra Textract cost. */
export async function startTableAnalysis(bucket: string, key: string): Promise<string> {
  const result = await getTextractClient().send(
    new StartDocumentAnalysisCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
      FeatureTypes: ["TABLES"],
    }),
  );
  if (!result.JobId) throw new Error("Textract did not return a JobId.");
  return result.JobId;
}

export class TextractTimeoutError extends Error {
  constructor() {
    super("Textract extraction is taking longer than expected.");
    this.name = "TextractTimeoutError";
  }
}

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 40_000;

/** Polls until the job finishes, collecting every page of Blocks. Throws TextractTimeoutError past
 *  the ~40s cap — the caller should surface that as "try again or fill the form manually". */
export async function pollDocumentAnalysis(jobId: string): Promise<Block[]> {
  const client = getTextractClient();
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await client.send(new GetDocumentAnalysisCommand({ JobId: jobId }));

    if (result.JobStatus === "FAILED") {
      throw new Error(result.StatusMessage ?? "Textract analysis failed.");
    }

    if (result.JobStatus === "SUCCEEDED" || result.JobStatus === "PARTIAL_SUCCESS") {
      const blocks = [...(result.Blocks ?? [])];
      let nextToken = result.NextToken;
      while (nextToken) {
        const nextPage = await client.send(new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken }));
        blocks.push(...(nextPage.Blocks ?? []));
        nextToken = nextPage.NextToken;
      }
      return blocks;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new TextractTimeoutError();
}

function buildBlockIndex(blocks: Block[]): Map<string, Block> {
  const index = new Map<string, Block>();
  for (const block of blocks) {
    if (block.Id) index.set(block.Id, block);
  }
  return index;
}

function getChildBlocks(block: Block, blockById: Map<string, Block>, type: string): Block[] {
  const childIds = block.Relationships?.find((r) => r.Type === "CHILD")?.Ids ?? [];
  const children: Block[] = [];
  for (const id of childIds) {
    const child = blockById.get(id);
    if (child?.BlockType === type) children.push(child);
  }
  return children;
}

function getCellText(cell: Block, blockById: Map<string, Block>): string {
  return getChildBlocks(cell, blockById, "WORD")
    .map((w) => w.Text ?? "")
    .join(" ")
    .trim();
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Reconstructs a TABLE block's CELL children into a { rowIndex -> { colIndex -> text } } grid,
 *  plus the highest column index seen. Shared by both line-item and key/value table extraction. */
function buildTableGrid(table: Block, blockById: Map<string, Block>) {
  const cells = getChildBlocks(table, blockById, "CELL");
  const rows = new Map<number, Map<number, string>>();
  let maxCol = 0;

  for (const cell of cells) {
    const rowIndex = cell.RowIndex ?? 0;
    const colIndex = cell.ColumnIndex ?? 0;
    maxCol = Math.max(maxCol, colIndex);
    const row = rows.get(rowIndex) ?? new Map<number, string>();
    row.set(colIndex, getCellText(cell, blockById));
    rows.set(rowIndex, row);
  }

  const rowIndices = [...rows.keys()].sort((a, b) => a - b);
  return { rows, rowIndices, maxCol };
}

const HEADER_HINT_KEYWORDS = [
  "description",
  "item",
  "particular",
  "qty",
  "quantity",
  "unit price",
  "price",
  "rate",
  "amount",
];

function scoreHeaderRow(row: Map<number, string>, maxCol: number): number {
  let score = 0;
  for (let col = 1; col <= maxCol; col++) {
    const text = (row.get(col) ?? "").toLowerCase();
    if (HEADER_HINT_KEYWORDS.some((kw) => text.includes(kw))) score += 1;
  }
  return score;
}

/** Scans the first few rows of a table grid for the one that most looks like a real column header
 *  (matches the most keyword hints), instead of assuming the header is always row 0 or 1 — real
 *  documents often print a title row, a note row ("All prices are in LKR"), and/or a plain
 *  column-index row ("1 2 3 ... 8=5*7 ...") above the actual text header. Returns a score of 0
 *  when nothing in the scanned rows looks like a header at all (e.g. a continuation table on a
 *  later page, which repeats no header of its own) so the caller can tell a "found nothing" 0 from
 *  a genuine index-0 header. */
function findHeaderRowIndex(
  rows: Map<number, Map<number, string>>,
  rowIndices: number[],
  maxCol: number,
): { index: number; score: number } {
  const rowsToCheck = Math.min(5, rowIndices.length);
  let bestIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < rowsToCheck; i++) {
    const score = scoreHeaderRow(rows.get(rowIndices[i])!, maxCol);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { index: bestIndex, score: bestScore };
}

function findColumn(
  headerRow: Map<number, string>,
  maxCol: number,
  keywords: string[],
  used: Set<number>,
): number | null {
  for (let col = 1; col <= maxCol; col++) {
    if (used.has(col)) continue;
    const text = (headerRow.get(col) ?? "").toLowerCase();
    if (keywords.some((kw) => text.includes(kw))) return col;
  }
  return null;
}

/** Best-effort table -> line-item extraction. Skips tables with fewer than 3 columns (those are
 *  almost always a label/value metadata table, like eGP Sri Lanka's "Primary Details" block, not
 *  an item table). Guesses which column is Item/Qty/Unit Price by header keyword match — checking
 *  "description" before the more generic "item" so a leading "Item No" (row number) column doesn't
 *  win over the actual description column.
 *
 *  Multi-page tender documents are frequently split by Textract into one TABLE block per page,
 *  where only the first page's table carries the header row — later pages are pure continuation
 *  data with the same columns but no header of their own to detect. The column mapping found from
 *  the most recent real header is carried forward across tables so those headerless continuation
 *  fragments still map to the right fields instead of falling back to column order.
 *
 *  This is inherently heuristic; the UI must let the user correct results before saving. */
export function extractLineItemsFromTables(blocks: Block[]): PriceScheduleLineItem[] {
  const blockById = buildBlockIndex(blocks);
  const tables = blocks.filter((b) => b.BlockType === "TABLE");
  const lineItems: PriceScheduleLineItem[] = [];
  let idCounter = 0;

  let knownItemCol: number | null = null;
  let knownQtyCol: number | null = null;
  let knownUnitPriceCol: number | null = null;

  for (const table of tables) {
    const { rows, rowIndices, maxCol } = buildTableGrid(table, blockById);
    if (maxCol < 3) continue; // 1-2 column tables are key/value metadata, not line items

    const header = findHeaderRowIndex(rows, rowIndices, maxCol);
    let itemCol: number;
    let qtyCol: number;
    let unitPriceCol: number;
    let dataStartIndex: number;

    if (header.score > 0) {
      const headerRow = rows.get(rowIndices[header.index])!;
      const used = new Set<number>();

      let foundItemCol = findColumn(headerRow, maxCol, ["description"], used);
      if (foundItemCol === null) foundItemCol = findColumn(headerRow, maxCol, ["item", "particular"], used);
      if (foundItemCol !== null) used.add(foundItemCol);

      let foundQtyCol = findColumn(headerRow, maxCol, ["qty", "quantity"], used);
      if (foundQtyCol !== null) used.add(foundQtyCol);

      let foundUnitPriceCol = findColumn(headerRow, maxCol, ["unit price", "price", "rate", "amount"], used);
      if (foundUnitPriceCol !== null) used.add(foundUnitPriceCol);

      itemCol = foundItemCol ?? knownItemCol ?? 1;
      qtyCol = foundQtyCol ?? knownQtyCol ?? 2;
      unitPriceCol = foundUnitPriceCol ?? knownUnitPriceCol ?? 3;
      dataStartIndex = header.index + 1;
    } else if (knownItemCol !== null && knownQtyCol !== null && knownUnitPriceCol !== null) {
      // No header found in this table at all — a continuation fragment. Reuse the mapping an
      // earlier table in this document already established, and treat every row here as data.
      itemCol = knownItemCol;
      qtyCol = knownQtyCol;
      unitPriceCol = knownUnitPriceCol;
      dataStartIndex = 0;
    } else {
      // First table in the document and nothing recognizable — fall back to column order.
      itemCol = 1;
      qtyCol = 2;
      unitPriceCol = 3;
      dataStartIndex = 0;
    }

    knownItemCol = itemCol;
    knownQtyCol = qtyCol;
    knownUnitPriceCol = unitPriceCol;

    for (const rowIndex of rowIndices.slice(dataStartIndex)) {
      const row = rows.get(rowIndex)!;
      const itemText = row.get(itemCol) ?? "";
      if (!itemText) continue;

      idCounter += 1;
      lineItems.push({
        id: `extracted-${idCounter}`,
        item: itemText,
        qty: parseNumber(row.get(qtyCol) ?? "0"),
        unitPrice: parseNumber(row.get(unitPriceCol) ?? "0"),
      });
    }
  }

  return lineItems;
}

type ExtractedMetadata = Partial<Omit<PriceScheduleMetadata, "uploadingDate">>;

const LABEL_PATTERNS: Record<keyof ExtractedMetadata, RegExp> = {
  procurementNo: /procurement\s*(?:no\.?|number)\s*[:\-]\s*(.+)/i,
  procurementTitle: /(?:title|description\s+of\s+procurement)\s*[:\-]\s*(.+)/i,
  procuringEntity: /(?:procuring\s*)?entity\s*[:\-]\s*(.+)/i,
  closingDate: /closing\s*date\s*[:\-]\s*(.+)/i,
};

/** Normalizes a handful of common date formats to ISO (YYYY-MM-DD). Returns undefined instead of
 *  guessing when the format isn't recognized — an unparsed date should stay blank for manual entry,
 *  never silently wrong. */
function parseDateToISO(text: string): string | undefined {
  const trimmed = text.trim();

  let match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  match = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const [, d, monthName, y] = match;
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    if (!Number.isNaN(monthIndex)) {
      return `${y}-${String(monthIndex + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return undefined;
}

/** Best-effort metadata extraction from plain OCR text (LINE blocks) via label regex — free, since
 *  it's part of the same TABLES-feature response. Leaves a field unset rather than guessing wrong. */
export function extractMetadataFromLines(blocks: Block[]): ExtractedMetadata {
  const lines = blocks.filter((b) => b.BlockType === "LINE").map((b) => b.Text ?? "");
  const result: ExtractedMetadata = {};

  for (const line of lines) {
    if (!result.procurementNo) {
      const match = line.match(LABEL_PATTERNS.procurementNo);
      if (match) result.procurementNo = match[1].trim();
    }
    if (!result.procurementTitle) {
      const match = line.match(LABEL_PATTERNS.procurementTitle);
      if (match) result.procurementTitle = match[1].trim();
    }
    if (!result.procuringEntity) {
      const match = line.match(LABEL_PATTERNS.procuringEntity);
      if (match) result.procuringEntity = match[1].trim();
    }
    if (!result.closingDate) {
      const match = line.match(LABEL_PATTERNS.closingDate);
      if (match) {
        const iso = parseDateToISO(match[1]);
        if (iso) result.closingDate = iso;
      }
    }
  }

  return result;
}

const TABLE_LABEL_ALIASES: Record<keyof ExtractedMetadata, string[]> = {
  // "IFe-Q Number" is the Sri Lanka eGP portal's own term for the procurement reference.
  procurementNo: ["ife-q number", "ifb number", "procurement no", "procurement number", "tender no", "bid no"],
  procurementTitle: ["title of the procurement", "procurement title", "title"],
  // "Name of the PE" — "PE" = Procuring Entity, eGP's usual abbreviation.
  procuringEntity: ["name of the pe", "procuring entity", "name of the procuring entity", "entity"],
  closingDate: ["closing date"],
};

function matchLabel(label: string): keyof ExtractedMetadata | null {
  const normalized = label.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(TABLE_LABEL_ALIASES) as [keyof ExtractedMetadata, string[]][]) {
    if (aliases.some((alias) => normalized.includes(alias))) return field;
  }
  return null;
}

/** Recovers metadata from 2-column label/value tables (e.g. eGP Sri Lanka's "Primary Details"
 *  block) — more reliable than line-text regex when a document structures fields this way, since
 *  the label and value live in separate cells rather than one "label: value" line of text. */
function extractMetadataFromTables(blocks: Block[]): ExtractedMetadata {
  const blockById = buildBlockIndex(blocks);
  const tables = blocks.filter((b) => b.BlockType === "TABLE");
  const result: ExtractedMetadata = {};

  for (const table of tables) {
    const { rows, rowIndices, maxCol } = buildTableGrid(table, blockById);
    if (maxCol !== 2) continue; // label | value tables only

    for (const rowIndex of rowIndices) {
      const row = rows.get(rowIndex)!;
      const label = (row.get(1) ?? "").trim();
      const value = (row.get(2) ?? "").trim();
      if (!label || !value) continue;

      const field = matchLabel(label);
      if (!field || result[field]) continue;

      if (field === "closingDate") {
        const iso = parseDateToISO(value);
        if (iso) result.closingDate = iso;
      } else {
        result[field] = value;
      }
    }
  }

  return result;
}

/** Combines table-based (checked first — more reliable when the document actually uses a
 *  label/value table) and line-regex metadata extraction, filling any still-missing field from
 *  whichever source found it. */
export function extractMetadata(blocks: Block[]): ExtractedMetadata {
  const fromLines = extractMetadataFromLines(blocks);
  const fromTables = extractMetadataFromTables(blocks);
  return { ...fromLines, ...fromTables };
}

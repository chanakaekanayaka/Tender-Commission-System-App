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

const HEADER_KEYWORDS = {
  item: ["item", "description", "particular"],
  qty: ["qty", "quantity"],
  unitPrice: ["price", "rate", "amount", "unit"],
};

function matchesColumn(headerText: string, keywords: string[]): boolean {
  const normalized = headerText.toLowerCase();
  return keywords.some((kw) => normalized.includes(kw));
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Best-effort table -> line-item extraction. Guesses which column is Item/Qty/Unit Price by header
 *  keyword match, falling back to column order (1st/2nd/3rd) when headers aren't recognized. This is
 *  inherently heuristic — the cheapest Textract tier and the wide variety of real tender document
 *  layouts mean misreads happen; the UI must let the user correct results before saving. */
export function extractLineItemsFromTables(blocks: Block[]): PriceScheduleLineItem[] {
  const blockById = buildBlockIndex(blocks);
  const tables = blocks.filter((b) => b.BlockType === "TABLE");
  const lineItems: PriceScheduleLineItem[] = [];
  let idCounter = 0;

  for (const table of tables) {
    const cells = getChildBlocks(table, blockById, "CELL");
    if (cells.length === 0) continue;

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
    if (rowIndices.length < 2) continue; // needs at least a header + 1 data row

    const headerRow = rows.get(rowIndices[0])!;
    let itemCol: number | null = null;
    let qtyCol: number | null = null;
    let unitPriceCol: number | null = null;
    for (let col = 1; col <= maxCol; col++) {
      const headerText = headerRow.get(col) ?? "";
      if (itemCol === null && matchesColumn(headerText, HEADER_KEYWORDS.item)) itemCol = col;
      else if (qtyCol === null && matchesColumn(headerText, HEADER_KEYWORDS.qty)) qtyCol = col;
      else if (unitPriceCol === null && matchesColumn(headerText, HEADER_KEYWORDS.unitPrice)) unitPriceCol = col;
    }
    if (itemCol === null) itemCol = 1;
    if (qtyCol === null) qtyCol = 2;
    if (unitPriceCol === null) unitPriceCol = 3;

    for (const rowIndex of rowIndices.slice(1)) {
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

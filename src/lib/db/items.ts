import { getSignedImageUrl } from "@/lib/aws/s3";
import { ItemModel, type ItemDocument, type ItemSpecSubdoc } from "@/lib/db/models/Item.model";
import type { CatalogItem } from "@/shared/types/item.types";

const MAX_CODE_ATTEMPTS = 5;

export class ItemAlreadyExistsError extends Error {
  constructor() {
    super("An item with this name already exists.");
    this.name = "ItemAlreadyExistsError";
  }
}

interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, number>;
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}

/** Which unique index a duplicate-key error tripped — `code` (a code collision, safe to retry
 *  with a freshly recomputed one) vs `nameKey` (a genuine duplicate item, not retryable). */
function duplicateKeyField(err: MongoDuplicateKeyError): string | undefined {
  return err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
}

/** Next code is always derived from whatever's actually in the Items collection right now (highest
 *  existing "ITM-####" + 1, or ITM-0001 if none exist) — never a separately-persisted counter. That
 *  makes it self-healing: if items are ever deleted directly in the database (bypassing the app),
 *  the very next one created just continues from the real current state instead of replaying stale
 *  numbers from before the deletion. */
async function nextItemCode(): Promise<string> {
  const highest = await ItemModel.findOne().sort({ code: -1 }).select("code").lean<{ code: string }>();
  const nextSeq = highest ? Number(highest.code.slice(4)) + 1 : 1;
  return `ITM-${String(nextSeq).padStart(4, "0")}`;
}

/** Inserts a new Item, retrying with a freshly recomputed code if two requests race for the same
 *  next number (the code unique index rejects the loser) — but a nameKey collision means a genuine
 *  duplicate item and is never retried. */
async function insertItem(name: string, nameKey: string): Promise<ItemDocument> {
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    const code = await nextItemCode();
    try {
      return await ItemModel.create({ code, name, nameKey, specs: [] });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      if (duplicateKeyField(err) === "nameKey") throw new ItemAlreadyExistsError();
      if (attempt === MAX_CODE_ATTEMPTS) throw err;
      // Otherwise it was the `code` index — another request just took this number; loop and
      // recompute the next one from the now-updated collection state.
    }
  }
  throw new Error("Failed to assign an item code after multiple attempts.");
}

/** Finds the Item matching this Price Schedule line's description (by normalized name), or
 *  creates one with an auto-generated sequential code (ITM-0001, ITM-0002, ...). This is how the
 *  Items catalog stays in sync with whatever's actually been tendered, instead of being a
 *  separately hand-maintained list — every saved Price Schedule line item feeds it. */
export async function resolveItemCode(rawName: string): Promise<string> {
  const name = rawName.trim();
  const nameKey = name.toLowerCase();

  const existing = await ItemModel.findOne({ nameKey });
  if (existing) return existing.code;

  try {
    const created = await insertItem(name, nameKey);
    return created.code;
  } catch (err) {
    // Another request created the same item between our findOne and insertItem — use theirs.
    if (err instanceof ItemAlreadyExistsError) {
      const raceWinner = await ItemModel.findOne({ nameKey });
      if (raceWinner) return raceWinner.code;
    }
    throw err;
  }
}

/** Manually adding a new catalog item (Catalog page "Add New Item") — always creates a brand-new
 *  record, rejecting an outright duplicate name up front rather than letting the DB reject it. */
export async function createItem(rawName: string): Promise<ItemDocument> {
  const name = rawName.trim();
  const nameKey = name.toLowerCase();

  const existing = await ItemModel.findOne({ nameKey });
  if (existing) throw new ItemAlreadyExistsError();

  return insertItem(name, nameKey);
}

/** Shared by every Items page (Catalog, Create Specs Doc — admin and staff): loads the catalog
 *  and resolves each item's image to a short-lived signed URL (the bucket is private). */
export async function getCatalogItems(): Promise<CatalogItem[]> {
  const items = await ItemModel.find().sort({ code: 1 });

  return Promise.all(
    items.map(async (item) => ({
      id: item._id.toString(),
      code: item.code,
      name: item.name,
      imageUrl: item.imageKey ? await getSignedImageUrl(item.imageKey) : "",
      specs: item.specs.map((spec: ItemSpecSubdoc, index: number) => ({
        id: `${item._id.toString()}-${index}`,
        label: spec.label,
        value: spec.value,
      })),
    })),
  );
}

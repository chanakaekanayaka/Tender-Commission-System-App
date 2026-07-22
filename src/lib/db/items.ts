import { getSignedImageUrl } from "@/lib/aws/s3";
import { ItemModel, type ItemSpecSubdoc } from "@/lib/db/models/Item.model";
import { getNextSequence } from "@/lib/db/models/Counter.model";
import type { CatalogItem } from "@/shared/types/item.types";

/** Finds the Item matching this Price Schedule line's description (by normalized name), or
 *  creates one with an auto-generated sequential code (ITM-0001, ITM-0002, ...). This is how the
 *  Items catalog stays in sync with whatever's actually been tendered, instead of being a
 *  separately hand-maintained list — every saved Price Schedule line item feeds it. */
export async function resolveItemCode(rawName: string): Promise<string> {
  const name = rawName.trim();
  const nameKey = name.toLowerCase();

  const existing = await ItemModel.findOne({ nameKey });
  if (existing) return existing.code;

  const seq = await getNextSequence("itemCode");
  const code = `ITM-${String(seq).padStart(4, "0")}`;

  try {
    const created = await ItemModel.create({ code, name, nameKey, specs: [] });
    return created.code;
  } catch (err) {
    // Another request created the same item between our findOne and create — use theirs.
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
      const raceWinner = await ItemModel.findOne({ nameKey });
      if (raceWinner) return raceWinner.code;
    }
    throw err;
  }
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

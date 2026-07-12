import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import type { CatalogItem } from "@/shared/types/item.types";

export async function listItems(): Promise<CatalogItem[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.ITEMS }));
  return (result.Items ?? []) as CatalogItem[];
}

export async function getItemById(id: string): Promise<CatalogItem | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.ITEMS, Key: { id } }));
  return (result.Item as CatalogItem) ?? null;
}

export async function createItem(item: CatalogItem): Promise<CatalogItem> {
  await ddb.send(new PutCommand({ TableName: TABLES.ITEMS, Item: item }));
  return item;
}

export async function updateItem(id: string, patch: Partial<Omit<CatalogItem, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.ITEMS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

export async function deleteItem(id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.ITEMS, Key: { id } }));
}

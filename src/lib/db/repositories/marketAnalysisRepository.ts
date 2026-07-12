import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import type { MarketAnalysisEntry } from "@/shared/types/item.types";

export async function listMarketAnalysisEntries(): Promise<MarketAnalysisEntry[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.MARKET_ANALYSIS }));
  return (result.Items ?? []) as MarketAnalysisEntry[];
}

export async function getMarketAnalysisEntryById(id: string): Promise<MarketAnalysisEntry | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.MARKET_ANALYSIS, Key: { id } }));
  return (result.Item as MarketAnalysisEntry) ?? null;
}

export async function createMarketAnalysisEntry(entry: MarketAnalysisEntry): Promise<MarketAnalysisEntry> {
  await ddb.send(new PutCommand({ TableName: TABLES.MARKET_ANALYSIS, Item: entry }));
  return entry;
}

export async function updateMarketAnalysisEntry(
  id: string,
  patch: Partial<Omit<MarketAnalysisEntry, "id">>,
): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.MARKET_ANALYSIS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

export async function deleteMarketAnalysisEntry(id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.MARKET_ANALYSIS, Key: { id } }));
}

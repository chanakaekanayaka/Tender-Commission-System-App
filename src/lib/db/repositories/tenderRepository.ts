import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";
import type { PriceScheduleLineItem, PriceScheduleStatus } from "@/shared/types/tender.types";

/**
 * Canonical stored shape — a tender's summary fields (history table), metadata
 * (job order wizard prefill), and line items are three different *views* over
 * the same record in the UI types, but they're always written/read together
 * as one item here.
 */
export interface TenderRecord {
  id: string;
  procurementNo: string;
  procurementTitle: string;
  procuringEntity: string;
  closingDate: string;
  uploadingDate: string;
  totalValue: number;
  status: PriceScheduleStatus;
  lineItems: PriceScheduleLineItem[];
}

export async function listTenders(): Promise<TenderRecord[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.TENDERS }));
  return (result.Items ?? []) as TenderRecord[];
}

export async function getTenderById(id: string): Promise<TenderRecord | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.TENDERS, Key: { id } }));
  return (result.Item as TenderRecord) ?? null;
}

/** Backs the Job Order wizard's procurement lookup (metadata + line item prefill). */
export async function getTenderByProcurementNo(procurementNo: string): Promise<TenderRecord | null> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.TENDERS,
      IndexName: INDEXES.TENDERS_BY_PROCUREMENT_NO,
      KeyConditionExpression: "procurementNo = :procurementNo",
      ExpressionAttributeValues: { ":procurementNo": procurementNo },
    }),
  );
  return (result.Items?.[0] as TenderRecord) ?? null;
}

export async function createTender(tender: TenderRecord): Promise<TenderRecord> {
  await ddb.send(new PutCommand({ TableName: TABLES.TENDERS, Item: tender }));
  return tender;
}

export async function updateTender(id: string, patch: Partial<Omit<TenderRecord, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.TENDERS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

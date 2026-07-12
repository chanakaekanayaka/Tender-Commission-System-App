import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";
import type { InvoiceRequest, InvoiceStatus } from "@/shared/types/invoice.types";

export async function getInvoiceById(id: string): Promise<InvoiceRequest | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.INVOICES, Key: { id } }));
  return (result.Item as InvoiceRequest) ?? null;
}

/** Admin's "Pending Review" queue and "Paid" history — same GSI, different partition value. */
export async function listInvoicesByStatus(status: InvoiceStatus): Promise<InvoiceRequest[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.INVOICES,
      IndexName: INDEXES.INVOICES_BY_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    }),
  );
  return (result.Items ?? []) as InvoiceRequest[];
}

/** Staff's own invoice history. */
export async function listInvoicesBySubmitter(submittedBy: string): Promise<InvoiceRequest[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.INVOICES,
      IndexName: INDEXES.INVOICES_BY_SUBMITTER,
      KeyConditionExpression: "submittedBy = :submittedBy",
      ExpressionAttributeValues: { ":submittedBy": submittedBy },
    }),
  );
  return (result.Items ?? []) as InvoiceRequest[];
}

export async function createInvoice(invoice: InvoiceRequest): Promise<InvoiceRequest> {
  await ddb.send(new PutCommand({ TableName: TABLES.INVOICES, Item: invoice }));
  return invoice;
}

export async function updateInvoice(id: string, patch: Partial<Omit<InvoiceRequest, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.INVOICES,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

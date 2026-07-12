import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";
import type { JobOrderCompletionStep, JobOrderLineItem, JobOrderMetadata } from "@/shared/types/job-order.types";

export type JobOrderStatus = "Active" | "Pending" | "Completed";

/** Same as the UI's ReceiptItem, but `previewUrl` (a client-only `URL.createObjectURL` blob) is replaced by the S3 key the file was actually uploaded to. */
export interface StoredReceiptItem {
  id: string;
  fileName: string;
  amount: number;
  fileType: string;
  s3Key: string;
}

/** Canonical stored shape for a job order — combines the wizard metadata/line-items/receipts and the financial-summary + status fields that the various Active/Pending/History table views each show a slice of. */
export interface JobOrderRecord {
  id: string;
  jobOrderNo: string;
  procurementNo: string;
  userId: string;
  status: JobOrderStatus;
  completedStep: JobOrderCompletionStep;
  metadata: JobOrderMetadata;
  lineItems: JobOrderLineItem[];
  receipts: StoredReceiptItem[];
  commissionValue: number;
  otherExpensesTotal: number;
  billAmount?: number;
  billGeneratedDate?: string;
  documentName?: string;
}

export async function getJobOrderById(id: string): Promise<JobOrderRecord | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.JOB_ORDERS, Key: { id } }));
  return (result.Item as JobOrderRecord) ?? null;
}

/** Staff's own Active/Pending job orders — status optionally narrows further via the GSI's sort key. */
export async function listJobOrdersByUser(userId: string, status?: JobOrderStatus): Promise<JobOrderRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.JOB_ORDERS,
      IndexName: INDEXES.JOB_ORDERS_BY_USER,
      KeyConditionExpression: status ? "userId = :userId AND #status = :status" : "userId = :userId",
      ExpressionAttributeNames: status ? { "#status": "status" } : undefined,
      ExpressionAttributeValues: status ? { ":userId": userId, ":status": status } : { ":userId": userId },
    }),
  );
  return (result.Items ?? []) as JobOrderRecord[];
}

/** Admin's Active / Pending (payment) / History tables — one query per status, sorted by billGeneratedDate. */
export async function listJobOrdersByStatus(status: JobOrderStatus): Promise<JobOrderRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.JOB_ORDERS,
      IndexName: INDEXES.JOB_ORDERS_BY_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    }),
  );
  return (result.Items ?? []) as JobOrderRecord[];
}

/** All job orders raised against a given tender. */
export async function listJobOrdersByProcurement(procurementNo: string): Promise<JobOrderRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.JOB_ORDERS,
      IndexName: INDEXES.JOB_ORDERS_BY_PROCUREMENT,
      KeyConditionExpression: "procurementNo = :procurementNo",
      ExpressionAttributeValues: { ":procurementNo": procurementNo },
    }),
  );
  return (result.Items ?? []) as JobOrderRecord[];
}

export async function createJobOrder(jobOrder: JobOrderRecord): Promise<JobOrderRecord> {
  await ddb.send(new PutCommand({ TableName: TABLES.JOB_ORDERS, Item: jobOrder }));
  return jobOrder;
}

export async function updateJobOrder(id: string, patch: Partial<Omit<JobOrderRecord, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.JOB_ORDERS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";
import type { ExpenseCategory } from "@/shared/types/other-expense.types";

/** Which of the two expense flows this record belongs to — standalone (staff-recorded, feeds invoice generation) or job-order-linked (admin-recorded against a specific job order). */
export type OtherExpenseKind = "standalone" | "jobOrderLinked";
export type OtherExpenseStatus = "Pending" | "Invoiced" | "Approved";

export interface OtherExpenseRecord {
  id: string;
  kind: OtherExpenseKind;
  staffId?: string;
  jobOrderNo?: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  status: OtherExpenseStatus;
  receiptFileName?: string;
}

export async function getOtherExpenseById(id: string): Promise<OtherExpenseRecord | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.OTHER_EXPENSES, Key: { id } }));
  return (result.Item as OtherExpenseRecord) ?? null;
}

/** Staff's own standalone expense history. */
export async function listOtherExpensesByStaff(staffId: string): Promise<OtherExpenseRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.OTHER_EXPENSES,
      IndexName: INDEXES.OTHER_EXPENSES_BY_STAFF,
      KeyConditionExpression: "staffId = :staffId",
      ExpressionAttributeValues: { ":staffId": staffId },
    }),
  );
  return (result.Items ?? []) as OtherExpenseRecord[];
}

/** Admin's job-order-linked expense history for a given job order. */
export async function listOtherExpensesByJobOrder(jobOrderNo: string): Promise<OtherExpenseRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.OTHER_EXPENSES,
      IndexName: INDEXES.OTHER_EXPENSES_BY_JOB_ORDER,
      KeyConditionExpression: "jobOrderNo = :jobOrderNo",
      ExpressionAttributeValues: { ":jobOrderNo": jobOrderNo },
    }),
  );
  return (result.Items ?? []) as OtherExpenseRecord[];
}

/** Pulls the "Pending" pool used as a source when generating an invoice. */
export async function listOtherExpensesByStatus(status: OtherExpenseStatus): Promise<OtherExpenseRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.OTHER_EXPENSES,
      IndexName: INDEXES.OTHER_EXPENSES_BY_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    }),
  );
  return (result.Items ?? []) as OtherExpenseRecord[];
}

export async function createOtherExpense(expense: OtherExpenseRecord): Promise<OtherExpenseRecord> {
  await ddb.send(new PutCommand({ TableName: TABLES.OTHER_EXPENSES, Item: expense }));
  return expense;
}

export async function updateOtherExpense(id: string, patch: Partial<Omit<OtherExpenseRecord, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.OTHER_EXPENSES,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

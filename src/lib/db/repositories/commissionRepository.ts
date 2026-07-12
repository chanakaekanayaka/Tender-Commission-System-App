import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";

export type CommissionStatus = "Pending" | "Approved";

/**
 * Canonical stored shape. `commissionPaid` mirrors the UI's derived-value
 * convention (see AdminPendingCommission) — it's only written once Approve
 * actually happens, holding what was disbursed, not recomputed on every read.
 */
export interface CommissionRecord {
  id: string;
  jobOrderNo: string;
  staffId: string;
  staffName: string;
  profit: number;
  commissionRate: number;
  status: CommissionStatus;
  commissionPaid?: number;
  paymentRefNo?: string;
  paymentDate?: string;
}

export async function getCommissionById(id: string): Promise<CommissionRecord | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.COMMISSIONS, Key: { id } }));
  return (result.Item as CommissionRecord) ?? null;
}

/** Staff's own Pending/History commission lists. */
export async function listCommissionsByStaff(staffId: string, status: CommissionStatus): Promise<CommissionRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.COMMISSIONS,
      IndexName: INDEXES.COMMISSIONS_BY_STAFF_STATUS,
      KeyConditionExpression: "staffId = :staffId AND #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":staffId": staffId, ":status": status },
    }),
  );
  return (result.Items ?? []) as CommissionRecord[];
}

/** Admin's Pending Commissions queue / Commission History (all staff). */
export async function listCommissionsByStatus(status: CommissionStatus): Promise<CommissionRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.COMMISSIONS,
      IndexName: INDEXES.COMMISSIONS_BY_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    }),
  );
  return (result.Items ?? []) as CommissionRecord[];
}

export async function createCommission(commission: CommissionRecord): Promise<CommissionRecord> {
  await ddb.send(new PutCommand({ TableName: TABLES.COMMISSIONS, Item: commission }));
  return commission;
}

export async function updateCommission(id: string, patch: Partial<Omit<CommissionRecord, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.COMMISSIONS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

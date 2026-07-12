import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { INDEXES, TABLES } from "@/lib/db/tables";
import type { User, UserRole } from "@/shared/types/user.types";

export async function listUsers(): Promise<User[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.USERS }));
  return (result.Items ?? []) as User[];
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await ddb.send(new GetCommand({ TableName: TABLES.USERS, Key: { id } }));
  return (result.Item as User) ?? null;
}

/** Backs the "Assign to Staff" dropdown in the Job Order wizard — only Staff accounts are assignable. */
export async function listUsersByRole(role: UserRole): Promise<User[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: INDEXES.USERS_BY_ROLE,
      KeyConditionExpression: "#role = :role",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": role },
    }),
  );
  return (result.Items ?? []) as User[];
}

export async function createUser(user: User): Promise<User> {
  await ddb.send(new PutCommand({ TableName: TABLES.USERS, Item: user }));
  return user;
}

export async function updateUser(id: string, patch: Partial<Omit<User, "id">>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id },
      UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
    }),
  );
}

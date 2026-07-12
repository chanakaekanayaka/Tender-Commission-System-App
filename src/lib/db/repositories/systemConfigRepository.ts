import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/db/client";
import { SYSTEM_CONFIG_KEY, TABLES } from "@/lib/db/tables";
import type { SystemConfig } from "@/shared/types/system-config.types";

/** SystemConfig is one app-wide record — always read/written under the fixed `configId` key, not per-user or per-entity. */
export async function getSystemConfig(): Promise<SystemConfig | null> {
  const result = await ddb.send(
    new GetCommand({ TableName: TABLES.SYSTEM_CONFIG, Key: { configId: SYSTEM_CONFIG_KEY } }),
  );
  if (!result.Item) return null;

  const { configId: _configId, ...config } = result.Item;
  return config as SystemConfig;
}

export async function putSystemConfig(config: SystemConfig): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLES.SYSTEM_CONFIG,
      Item: { configId: SYSTEM_CONFIG_KEY, ...config },
    }),
  );
}

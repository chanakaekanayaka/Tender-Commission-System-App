import { JobOrderModel } from "@/lib/db/models/JobOrder.model";

/** Next jobOrderNo (JO-{year}-####) is derived from whatever's actually in the JobOrders
 *  collection right now (highest existing number for the current year + 1) — never a separately
 *  persisted counter. Same reasoning as Item codes (src/lib/db/items.ts): a persisted counter can
 *  go stale if records are ever deleted directly in the database, silently skipping numbers or
 *  colliding; deriving from real current state is self-healing instead. */
export async function nextJobOrderNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JO-${year}-`;

  const highest = await JobOrderModel.findOne({ jobOrderNo: { $regex: `^${prefix}` } })
    .sort({ jobOrderNo: -1 })
    .select("jobOrderNo")
    .lean<{ jobOrderNo: string }>();

  const nextSeq = highest ? Number(highest.jobOrderNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

import type { Types } from "mongoose";
import { UserModel } from "@/lib/db/models/User.model";
import { buildSearchFilter } from "@/lib/db/pagination";

/**
 * Resolves a free-text search term against user names (firstName/lastName), for Admin tables whose
 * "staff name" column is joined from `User` via `createdBy` and isn't a real field on the record's
 * own model (Job Orders, Other Expenses) — so it can't be regex-matched directly there. Returns the
 * matching userIds to OR into the record model's own search via `paginateFind`'s `extraConditions`
 * (as `{ createdBy: { $in: ids } }`), alongside its own text fields (e.g. jobOrderNo, description).
 * Empty search returns no ids — callers only need this when `search` is non-blank anyway, since
 * `paginateFind` treats a blank search as "match everything".
 */
export async function findStaffIdsByName(search: string): Promise<Types.ObjectId[]> {
  const trimmed = search.trim();
  if (!trimmed) return [];
  const filter = buildSearchFilter({}, ["firstName", "lastName"], trimmed);
  const users = await UserModel.find(filter).select("_id");
  return users.map((user) => user._id);
}

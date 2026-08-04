import type { HydratedDocument, Model, QueryFilter } from "mongoose";

export interface PaginationParams {
  search: string;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  rows: HydratedDocument<T>[];
  total: number;
  page: number;
  totalPages: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Merges a case-insensitive `$or` regex across `searchFields` into `baseFilter` (a no-op when
 * `search` is blank). `extraConditions` — full Mongo conditions, not field names — are OR'd in
 * alongside the regex clauses; used for a search field that isn't actually on this model (e.g.
 * matching "staff name" against Job Orders by first resolving it to a `createdBy` id list via
 * `findStaffIdsByName`, see staffSearch.ts). Exported on its own, alongside `paginateFind`, for the
 * rare page that also needs to aggregate over the *entire* matching set (not just the current page)
 * — e.g. a "Total Pending" stat card — without duplicating the search-matching logic.
 */
export function buildSearchFilter<T>(
  baseFilter: QueryFilter<T>,
  searchFields: string[],
  search: string,
  extraConditions: QueryFilter<T>[] = [],
): QueryFilter<T> {
  const trimmedSearch = search.trim();
  if (!trimmedSearch) return baseFilter;
  return {
    ...baseFilter,
    $or: [
      ...searchFields.map((field) => ({
        [field]: { $regex: escapeRegExp(trimmedSearch), $options: "i" },
      })),
      ...extraConditions,
    ],
  };
}

/**
 * Backend search + pagination shared by every Staff/Admin table. `baseFilter` carries each page's
 * own window/role-scope logic untouched (e.g. `{ billVerifiedAt: null, createdBy: user._id }`) —
 * this only adds a case-insensitive `$or` regex across `searchFields` (plus any `extraConditions`,
 * see `buildSearchFilter`) and a skip/limit on top, it never widens what a Staff vs Admin is allowed
 * to see. `page` is clamped into `[1, totalPages]` so a stale page number (e.g. after the last row
 * on it was deleted) can't strand the caller on an empty page.
 */
export async function paginateFind<T>(
  model: Model<T>,
  baseFilter: QueryFilter<T>,
  searchFields: string[],
  { search, page, limit }: PaginationParams,
  sort: Record<string, 1 | -1> = { createdAt: -1 },
  extraConditions: QueryFilter<T>[] = [],
): Promise<PaginatedResult<T>> {
  const filter = buildSearchFilter(baseFilter, searchFields, search, extraConditions);

  const total = await model.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const rows = await model
    .find(filter)
    .sort(sort)
    .skip((currentPage - 1) * limit)
    .limit(limit);

  return { rows, total, page: currentPage, totalPages };
}

export function parsePageParam(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

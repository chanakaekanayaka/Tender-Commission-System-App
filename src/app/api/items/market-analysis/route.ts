import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { getTenderMarketComparisons } from "@/lib/db/marketAnalysis";
import { requireAuth } from "@/lib/auth/guard";
import { apiSuccess } from "@/lib/api/response";
import { parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";

/** Shared, company-wide analytics (not filtered by createdBy) — see getTenderMarketComparisons. */
export async function GET(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  const page = parsePageParam(request.nextUrl.searchParams.get("page") ?? undefined);

  await connectDB();
  const result = await getTenderMarketComparisons(page, DEFAULT_PAGE_SIZE);
  return apiSuccess(result);
}

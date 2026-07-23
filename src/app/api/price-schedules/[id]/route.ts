import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel, type PriceScheduleLineItemSubdoc } from "@/lib/db/models/PriceSchedule.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Fetches one Price Schedule's line items in full — used when linking a won tender to a new Job
 *  Order. Open to any authenticated role, not restricted to the schedule's own creator: once a
 *  tender is completed it's a shared company record, not personal to whoever scanned it. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { error } = requireAuth(request);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const record = await PriceScheduleModel.findById(id);
  if (!record) {
    return apiError("Price Schedule not found.", 404);
  }

  return apiSuccess({
    id: record._id.toString(),
    procurementNo: record.procurementNo,
    procurementTitle: record.procurementTitle,
    procuringEntity: record.procuringEntity,
    totalValue: record.totalValue,
    status: record.status,
    lineItems: record.lineItems.map((item: PriceScheduleLineItemSubdoc) => ({
      item: item.item,
      qty: item.qty,
      unitPrice: item.unitPrice,
    })),
  });
}

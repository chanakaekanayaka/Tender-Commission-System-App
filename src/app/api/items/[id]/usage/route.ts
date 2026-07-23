import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { ItemModel } from "@/lib/db/models/Item.model";
import { PriceScheduleModel, type PriceScheduleLineItemSubdoc } from "@/lib/db/models/PriceSchedule.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UsageRow {
  procurementNo: string;
  procuringEntity: string;
  closingDate: string;
  qty: number;
  unitPrice: number;
}

/** Every Price Schedule this Item's code has appeared in — the same product ordered at different
 *  quantities/prices across tenders stays a single Catalog entry (see src/lib/db/items.ts), so this
 *  is how that history is still visible without duplicating the catalog per occurrence. Open to any
 *  authenticated role, same as the Item itself: a shared company record, not creator-scoped. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { error } = requireAuth(request);
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const item = await ItemModel.findById(id).select("code");
  if (!item) {
    return apiError("Item not found.", 404);
  }

  const schedules = await PriceScheduleModel.find({ "lineItems.itemCode": item.code })
    .select("procurementNo procuringEntity closingDate lineItems")
    .sort({ closingDate: -1 });

  const usage: UsageRow[] = schedules.flatMap((schedule) =>
    schedule.lineItems
      .filter((line: PriceScheduleLineItemSubdoc) => line.itemCode === item.code)
      .map((line: PriceScheduleLineItemSubdoc) => ({
        procurementNo: schedule.procurementNo,
        procuringEntity: schedule.procuringEntity,
        closingDate: schedule.closingDate.toISOString().slice(0, 10),
        qty: line.qty,
        unitPrice: line.unitPrice,
      })),
  );

  return apiSuccess(usage);
}

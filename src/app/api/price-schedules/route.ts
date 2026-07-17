import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { requireAuth } from "@/lib/auth/guard";
import { createPriceScheduleSchema } from "@/lib/validation/price-schedule.schema";
import { apiError, apiSuccess } from "@/lib/api/response";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import type { PriceScheduleSummary } from "@/shared/types/tender.types";

/** Persists a reviewed/corrected Price Schedule. VAT is always computed server-side from the real
 *  System Config, never trusted from the client. */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const input = createPriceScheduleSchema.parse(body);

    await connectDB();
    const config = await getOrCreateSystemConfig();
    const vatRate = config.isVatRegistered ? config.vatPercentage / 100 : 0;

    let subTotal = 0;
    let vatAmount = 0;
    for (const item of input.lineItems) {
      const totals = calculateLineItemTotals(item.qty, item.unitPrice, vatRate);
      subTotal += totals.base;
      vatAmount += totals.vat;
    }

    const priceSchedule = await PriceScheduleModel.create({
      procurementNo: input.procurementNo,
      procurementTitle: input.procurementTitle,
      procuringEntity: input.procuringEntity,
      closingDate: new Date(input.closingDate),
      lineItems: input.lineItems,
      subTotal,
      vatAmount,
      totalValue: subTotal + vatAmount,
      status: input.status,
      sourceDocument: input.sourceDocument,
      createdBy: payload.userId,
    });

    return apiSuccess(priceSchedule.toJSON(), "Price Schedule saved successfully.", 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("POST /api/price-schedules failed:", err);
    return apiError("Something went wrong while saving the price schedule.", 500);
  }
}

/** Admin sees every Price Schedule; Staff sees only their own (AI_INSTRUCTIONS.md §3). */
export async function GET(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  await connectDB();
  const filter = payload.role === "Admin" ? {} : { createdBy: payload.userId };
  const records = await PriceScheduleModel.find(filter).sort({ createdAt: -1 });

  const summaries: PriceScheduleSummary[] = records.map((record) => ({
    id: record._id.toString(),
    procurementNo: record.procurementNo,
    entity: record.procuringEntity,
    closingDate: record.closingDate.toISOString().slice(0, 10),
    totalValue: record.totalValue,
    status: record.status,
  }));

  return apiSuccess(summaries);
}

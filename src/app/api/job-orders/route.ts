import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { nextJobOrderNo } from "@/lib/db/jobOrders";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireAuth } from "@/lib/auth/guard";
import { saveJobOrderSchema } from "@/lib/validation/job-order.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Creates a new Job Order (Draft or Completed) — "Save Draft" on first save, before a jobOrderId
 *  exists yet. Subsequent saves for the same wizard session go through PATCH /api/job-orders/[id]
 *  instead, so repeated "Save Draft" clicks update one record rather than piling up duplicates. */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const input = saveJobOrderSchema.parse(body);

    await connectDB();
    const jobOrderNo = await nextJobOrderNo();

    const jobOrder = await JobOrderModel.create({
      jobOrderNo,
      ...input,
      createdBy: payload.userId,
    });

    return apiSuccess(jobOrder.toJSON(), "Job Order saved successfully.", 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    // Mongo duplicate key (E11000) on the unique procurementNo index — this tender already has a
    // Job Order (the client lost track of its jobOrderId, e.g. after a page refresh mid-wizard).
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
      return apiError("A Job Order for this Procurement No already exists.", 409);
    }
    console.error("POST /api/job-orders failed:", err);
    return apiError("Something went wrong while saving the job order.", 500);
  }
}

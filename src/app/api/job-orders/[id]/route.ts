import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { requireAuth } from "@/lib/auth/guard";
import { saveJobOrderSchema } from "@/lib/validation/job-order.schema";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getSignedImageUrl } from "@/lib/aws/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Fetches a single Job Order — used to resume the wizard on an in-progress record (clicking a
 *  row's Job Order No or Receipt Upload in the Active table). Staff can only fetch their own
 *  (AI_INSTRUCTIONS.md §3); Admin can fetch any. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();
    const filter = payload.role === "Admin" ? { _id: id } : { _id: id, createdBy: payload.userId };

    const jobOrder = await JobOrderModel.findOne(filter);
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }

    const json = jobOrder.toJSON();
    const receipts: { s3Key: string; fileName: string; amount: number; fileType: string }[] = json.receipts;

    // Each already-uploaded receipt's blob preview only ever lived in the browser that uploaded
    // it — resuming the wizard elsewhere needs a fresh signed URL to preview/re-view the same file.
    const receiptsWithPreview = await Promise.all(
      receipts.map(async (receipt) => ({
        ...receipt,
        previewUrl: await getSignedImageUrl(receipt.s3Key),
      })),
    );

    return apiSuccess({ ...json, receipts: receiptsWithPreview });
  } catch {
    return apiError("Something went wrong while loading the job order.", 500);
  }
}

/** Updates an existing Job Order in place — every "Save Draft" click after the first one for the
 *  same wizard session lands here instead of POST, so the record is updated rather than
 *  duplicated. jobOrderNo is never touched here, only whatever the client resends. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const input = saveJobOrderSchema.parse(body);

    await connectDB();
    // Staff can only update their own drafts (AI_INSTRUCTIONS.md §3); Admin can update any.
    const filter = payload.role === "Admin" ? { _id: id } : { _id: id, createdBy: payload.userId };

    const jobOrder = await JobOrderModel.findOneAndUpdate(filter, input, { new: true, runValidators: true });
    if (!jobOrder) {
      return apiError("Job Order not found.", 404);
    }

    return apiSuccess(jobOrder.toJSON(), "Job Order saved successfully.");
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("PATCH /api/job-orders/[id] failed:", err);
    return apiError("Something went wrong while saving the job order.", 500);
  }
}

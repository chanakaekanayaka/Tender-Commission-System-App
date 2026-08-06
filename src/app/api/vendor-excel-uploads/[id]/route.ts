import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { VendorExcelUploadModel, type VendorExcelBlockSubdoc } from "@/lib/db/models/VendorExcelUpload.model";
import { requireAuth } from "@/lib/auth/guard";
import { linkVendorExcelUploadSchema } from "@/lib/validation/vendor-excel-upload.schema";
import { apiError, apiSuccess } from "@/lib/api/response";
import { isOurVendor } from "@/lib/utils/vendorMatch";
import { formatDateTime } from "@/lib/utils/date";
import type { VendorExcelUploadDetail } from "@/shared/types/vendorExcelUpload.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Full detail incl. every vendor block/item, open to any authenticated role once uploaded — same
 *  reasoning as GET /api/price-schedules/[id]: a shared company record, not personal to whoever
 *  uploaded it. Each block's `isOurVendor` is computed fresh against the *current* System Config
 *  companyName, never persisted, so it can't go stale if that name changes later. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { error } = requireAuth(request);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const [record, systemConfig] = await Promise.all([VendorExcelUploadModel.findById(id), getOrCreateSystemConfig()]);
  if (!record) {
    return apiError("Vendor comparison sheet not found.", 404);
  }

  const detail: VendorExcelUploadDetail = {
    id: record._id.toString(),
    fileName: record.sourceDocument.fileName,
    procurementNo: record.procurementNo,
    status: record.status,
    confirmed: record.confirmed,
    vendorCount: record.vendorBlocks.length,
    uploadedAt: formatDateTime(record.createdAt),
    vendorBlocks: record.vendorBlocks.map((block: VendorExcelBlockSubdoc) => ({
      vendorName: block.vendorName,
      isOurVendor: isOurVendor(block.vendorName, systemConfig.companyName),
      items: block.items,
    })),
  };

  return apiSuccess(detail);
}

/** Links a Pending upload to a Price Schedule (the "Link" action on the list page) — copies
 *  procurementNo from the schedule and flips status to Linked. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const input = linkVendorExcelUploadSchema.parse(body);

    await connectDB();
    const [record, schedule] = await Promise.all([
      VendorExcelUploadModel.findById(id),
      PriceScheduleModel.findById(input.priceScheduleId),
    ]);
    if (!record) {
      return apiError("Vendor comparison sheet not found.", 404);
    }
    if (!schedule) {
      return apiError("Selected Price Schedule was not found.", 404);
    }

    record.priceScheduleId = schedule._id;
    record.procurementNo = schedule.procurementNo;
    record.status = "Linked";
    await record.save();

    return apiSuccess(record.toJSON(), "Linked to the Price Schedule successfully.");
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    console.error("PATCH /api/vendor-excel-uploads/[id] failed:", err);
    return apiError("Something went wrong while linking the file.", 500);
  }
}

/** Undo a bad upload — only the uploader themselves or an Admin can delete it. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const record = await VendorExcelUploadModel.findById(id);
  if (!record) {
    return apiError("Vendor comparison sheet not found.", 404);
  }
  if (payload.role !== "Admin" && record.createdBy.toString() !== payload.userId) {
    return apiError("You don't have permission to do this.", 403);
  }

  await record.deleteOne();
  return apiSuccess(null, "Vendor comparison sheet deleted successfully.");
}

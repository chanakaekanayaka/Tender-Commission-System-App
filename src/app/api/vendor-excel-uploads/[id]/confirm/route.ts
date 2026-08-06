import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { VendorExcelUploadModel } from "@/lib/db/models/VendorExcelUpload.model";
import { requireAuth } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Explicit review gate before an upload's data is trusted for Market Analysis — only the
 *  uploader themselves or an Admin can confirm it, same ownership rule as deleting it. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const upload = await VendorExcelUploadModel.findById(id);
    if (!upload) {
      return apiError("Vendor comparison sheet not found.", 404);
    }
    if (payload.role !== "Admin" && upload.createdBy.toString() !== payload.userId) {
      return apiError("You don't have permission to do this.", 403);
    }

    upload.confirmed = true;
    await upload.save();

    return apiSuccess(upload.toJSON(), "Vendor comparison sheet confirmed.");
  } catch (err) {
    console.error("PATCH /api/vendor-excel-uploads/[id]/confirm failed:", err);
    return apiError("Something went wrong while confirming the file.", 500);
  }
}

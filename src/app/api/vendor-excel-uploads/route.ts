import type { NextRequest } from "next/server";
import { createHash, randomUUID } from "crypto";
import connectDB from "@/lib/db/connectDB";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { VendorExcelUploadModel } from "@/lib/db/models/VendorExcelUpload.model";
import { requireAuth } from "@/lib/auth/guard";
import { uploadDocumentToS3 } from "@/lib/aws/s3";
import { parseVendorComparisonWorkbook, VendorExcelParseError } from "@/lib/excel/vendorComparison";
import { apiError, apiSuccess } from "@/lib/api/response";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Uploads + parses a vendor comparison Excel (a real spreadsheet, not a scan — read directly with
 *  exceljs, no OCR). Rejects re-uploading the exact same file (by SHA-256 of its bytes) before
 *  spending time parsing it or a slot in S3. Optionally links it to an existing Price Schedule
 *  right away if the caller already knows which tender it's for (via `priceScheduleId` in the
 *  form data); otherwise it's saved as Pending. Open to any authenticated role, same as Price
 *  Schedule creation (AI_INSTRUCTIONS.md §3). */
export async function POST(request: NextRequest) {
  const { payload, error } = requireAuth(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const priceScheduleId = formData.get("priceScheduleId");

    if (!(file instanceof File)) {
      return apiError("No file uploaded.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Only Excel (.xlsx/.xls) files are supported.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash("sha256").update(buffer).digest("hex");

    await connectDB();

    const existing = await VendorExcelUploadModel.findOne({ contentHash });
    if (existing) {
      return apiError("This exact file has already been uploaded.", 409);
    }

    let vendorBlocks;
    try {
      vendorBlocks = await parseVendorComparisonWorkbook(buffer);
    } catch (err) {
      if (err instanceof VendorExcelParseError) {
        return apiError(err.message, 422);
      }
      throw err;
    }

    let procurementNo: string | undefined;
    let status: "Pending" | "Linked" = "Pending";
    let linkedPriceScheduleId: string | undefined;
    if (typeof priceScheduleId === "string" && priceScheduleId.trim()) {
      const schedule = await PriceScheduleModel.findById(priceScheduleId.trim());
      if (!schedule) {
        return apiError("Selected Price Schedule was not found.", 404);
      }
      procurementNo = schedule.procurementNo;
      status = "Linked";
      linkedPriceScheduleId = schedule._id.toString();
    }

    const key = `vendor-excel-uploads/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, key, file.type);

    const created = await VendorExcelUploadModel.create({
      procurementNo,
      priceScheduleId: linkedPriceScheduleId,
      status,
      contentHash,
      sourceDocument: { s3Key: key, fileName: file.name },
      vendorBlocks,
      createdBy: payload.userId,
    });

    return apiSuccess(created.toJSON(), "Vendor comparison sheet uploaded successfully.", 201);
  } catch (err) {
    console.error("POST /api/vendor-excel-uploads failed:", err);
    return apiError("Something went wrong while uploading the file.", 500);
  }
}

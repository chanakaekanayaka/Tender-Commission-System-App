import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { uploadDocumentToS3 } from "@/lib/aws/s3";
import { apiError, apiSuccess } from "@/lib/api/response";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Uploads one Job Order receipt (PDF or image) to S3 as soon as it's dropped in Step 2 — before
 *  the Job Order itself is ever saved, same pattern as Price Schedule's source document upload
 *  (src/app/api/price-schedules/extract/route.ts). The returned s3Key is what the wizard actually
 *  persists; the in-browser blob preview never leaves the client. */
export async function POST(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("No file uploaded.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Upload a PDF or image.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `job-orders/receipts/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, key, file.type);

    return apiSuccess({ s3Key: key, fileName: file.name }, "Receipt uploaded successfully.", 201);
  } catch (err) {
    console.error("POST /api/job-orders/receipts failed:", err);
    return apiError("Something went wrong while uploading the receipt.", 500);
  }
}

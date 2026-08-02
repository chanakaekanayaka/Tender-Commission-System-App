import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { requireRole } from "@/lib/auth/guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getSignedImageUrl, uploadDocumentToS3 } from "@/lib/aws/s3";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Admin uploading the company logo shown at the top of both portals' sidebars — real S3 upload,
 *  replacing whatever logo was there before. Uploading again simply overwrites the stored
 *  reference; the old file is left orphaned in S3 rather than deleted, same as every other
 *  "replace this upload" flow in the app. */
export async function POST(request: NextRequest) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("No file uploaded.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Unsupported file type. Upload a PNG, JPEG, WebP, or SVG image.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 5MB).", 400);
    }

    await connectDB();
    const config = await getOrCreateSystemConfig();

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `system-config/logo/${randomUUID()}/${file.name}`;
    await uploadDocumentToS3(buffer, s3Key, file.type);

    config.logo = { fileName: file.name, s3Key };
    await config.save();

    const logoUrl = await getSignedImageUrl(s3Key);
    return apiSuccess({ fileName: file.name, logoUrl }, "Logo uploaded successfully.");
  } catch (err) {
    console.error("POST /api/system-config/logo failed:", err);
    return apiError("Something went wrong while uploading the logo.", 500);
  }
}

/** Admin removing the company logo — both portals' sidebars fall back to the plain "TENDER-CMS"
 *  text again. The file itself is left in S3 rather than deleted, same as every other
 *  "replace/clear this upload" flow in the app. */
export async function DELETE(request: NextRequest) {
  const { error } = requireRole(request, "Admin");
  if (error) return error;

  try {
    await connectDB();
    const config = await getOrCreateSystemConfig();

    config.logo = null;
    await config.save();

    return apiSuccess(null, "Logo removed.");
  } catch (err) {
    console.error("DELETE /api/system-config/logo failed:", err);
    return apiError("Something went wrong while removing the logo.", 500);
  }
}

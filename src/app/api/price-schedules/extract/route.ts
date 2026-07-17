import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth/guard";
import { uploadDocumentToS3 } from "@/lib/aws/s3";
import {
  startTableAnalysis,
  pollDocumentAnalysis,
  extractLineItemsFromTables,
  extractMetadataFromLines,
  TextractTimeoutError,
} from "@/lib/aws/textract";
import { apiError, apiSuccess } from "@/lib/api/response";

// Vercel-specific — sets the max Lambda duration since Textract polling can take a while.
// Harmless no-op on other hosts (e.g. AWS Amplify, which governs its own compute timeout).
export const maxDuration = 60;

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/tiff"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Uploads the scanned tender document to S3, runs Textract table analysis, and returns the
 *  extracted (not yet persisted) metadata + line items for the user to review/correct before
 *  POSTing to /api/price-schedules. Open to any authenticated role — both Admin and Staff can
 *  create Price Schedules (AI_INSTRUCTIONS.md §3). */
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
      return apiError("Unsupported file type. Upload a PDF, PNG, JPEG, or TIFF.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File is too large (max 15MB).", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `price-schedules/${randomUUID()}/${file.name}`;
    const { bucket } = await uploadDocumentToS3(buffer, key, file.type);

    const jobId = await startTableAnalysis(bucket, key);
    const blocks = await pollDocumentAnalysis(jobId);

    const lineItems = extractLineItemsFromTables(blocks);
    const metadata = extractMetadataFromLines(blocks);

    return apiSuccess(
      { metadata, lineItems, sourceDocument: { s3Key: key, fileName: file.name } },
      "Document parsed successfully.",
    );
  } catch (err) {
    if (err instanceof TextractTimeoutError) {
      return apiError("Extraction is taking longer than expected. Try again or fill the form in manually.", 504);
    }
    console.error("POST /api/price-schedules/extract failed:", err);
    return apiError("Something went wrong while extracting the document.", 500);
  }
}

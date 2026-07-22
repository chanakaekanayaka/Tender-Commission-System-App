import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { getSignedImageUrl, uploadDocumentToS3 } from "@/lib/aws/s3";
import { ItemModel } from "@/lib/db/models/Item.model";
import { requireAuth } from "@/lib/auth/guard";
import { updateItemSpecsSchema } from "@/lib/validation/item.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PNG/JPEG only — pdfkit (used by the Specs Doc PDF generator) can only embed these two formats.
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Updates an Item's specs and/or image. Name/code aren't editable here — they're owned by
 *  resolveItemCode() (src/lib/db/items.ts), derived from Price Schedule line item text. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    const formData = await request.formData();

    const specsRaw = formData.get("specs");
    let specs: { label: string; value: string }[] = [];
    try {
      specs = updateItemSpecsSchema.parse({ specs: specsRaw ? JSON.parse(String(specsRaw)) : [] }).specs;
    } catch (err) {
      if (err instanceof ZodError) {
        return apiError("Invalid input.", 422, err.flatten().fieldErrors);
      }
      return apiError("Invalid specs payload.", 400);
    }

    await connectDB();
    const update: { specs: typeof specs; imageKey?: string } = { specs };

    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        return apiError("Unsupported image type. Upload a PNG or JPEG.", 400);
      }
      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        return apiError("Image is too large (max 5MB).", 400);
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      const key = `items/${id}/${randomUUID()}-${image.name}`;
      await uploadDocumentToS3(buffer, key, image.type);
      update.imageKey = key;
    }

    const item = await ItemModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!item) {
      return apiError("Item not found.", 404);
    }

    const imageUrl = item.imageKey ? await getSignedImageUrl(item.imageKey) : null;
    return apiSuccess({ ...item.toJSON(), imageUrl }, "Item updated successfully.");
  } catch (err) {
    console.error("PATCH /api/items/[id] failed:", err);
    return apiError("Something went wrong while updating the item.", 500);
  }
}

import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import connectDB from "@/lib/db/connectDB";
import { createItem, ItemAlreadyExistsError } from "@/lib/db/items";
import { requireAuth } from "@/lib/auth/guard";
import { createItemSchema } from "@/lib/validation/item.schema";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Manually adds a new Items catalog entry (Catalog page "Add New Item"). Code is always
 *  auto-assigned — see createItem() in src/lib/db/items.ts — never supplied by the client. */
export async function POST(request: NextRequest) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name } = createItemSchema.parse(body);

    await connectDB();
    const item = await createItem(name);

    return apiSuccess(item.toJSON(), "Item created successfully.", 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("Invalid input.", 422, err.flatten().fieldErrors);
    }
    if (err instanceof ItemAlreadyExistsError) {
      return apiError(err.message, 409);
    }
    console.error("POST /api/items failed:", err);
    return apiError("Something went wrong while creating the item.", 500);
  }
}

import { NextResponse } from "next/server";
import type { ApiResponse } from "@/shared/types/api.types";

/** Every route handler should return through these two helpers so responses stay consistent. */
export function apiSuccess<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status });
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json<ApiResponse<never>>({ success: false, message, errors }, { status });
}

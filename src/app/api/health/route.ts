import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";

// Otherwise Next.js can statically optimize this GET handler at build time since it has no
// request-dependent input — a diagnostic route needs to run fresh on every hit, not serve a cached result.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mongooseInstance = await connectDB();
    return NextResponse.json({
      success: true,
      message: "MongoDB connection is healthy",
      readyState: mongooseInstance.connection.readyState,
      // Surfaced so a wrong/missing db name in MONGODB_URI (e.g. defaulting to "test") is obvious at a glance.
      database: mongooseInstance.connection.name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
        errors: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

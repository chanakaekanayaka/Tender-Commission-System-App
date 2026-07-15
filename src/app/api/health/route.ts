import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";

export async function GET() {
  try {
    const mongooseInstance = await connectDB();
    return NextResponse.json({
      success: true,
      message: "MongoDB connection is healthy",
      readyState: mongooseInstance.connection.readyState,
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

import { NextResponse } from "next/server";

// TEMPORARY — diagnosing why MONGODB_URI/JWT_SECRET aren't reaching the Amplify Hosting
// runtime despite being set in both "Environment variables" and "Secrets". Reports only
// key presence/names, never values. Delete this route once the cause is confirmed.
export async function GET() {
  const relevantKeys = Object.keys(process.env)
    .filter((key) => !key.startsWith("_") && !key.startsWith("npm_"))
    .sort();

  return NextResponse.json({
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasJwtExpiresIn: Boolean(process.env.JWT_EXPIRES_IN),
    mongoUriLength: process.env.MONGODB_URI?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    awsRegion: process.env.AWS_REGION ?? null,
    allEnvKeys: relevantKeys,
  });
}

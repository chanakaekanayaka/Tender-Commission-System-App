import mongoose from "mongoose";

// Read lazily (called from connectDB() below), not at module-evaluation time: on AWS Amplify
// Hosting's Next.js compute, environment variables aren't reliably attached yet at the point
// shared server chunks first get evaluated - a top-level process.env.MONGODB_URI read there
// can throw even though the variable is correctly set. Reading it once connectDB() actually
// runs avoids that.
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable — set it in .env.local");
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Next.js reloads route modules on every request in dev and can invoke this
// module multiple times per server instance in serverless environments.
// Caching the connection on `globalThis` prevents opening a new MongoDB
// connection pool each time and exhausting Atlas's connection limit.
declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// No explicit credentials here — the AWS SDK's default credential provider chain picks up
// whatever's available: the Amplify Hosting SSR compute role in production, or `aws configure`
// credentials locally. `AWS_REGION` itself is a Lambda-provided runtime var, never something we set.
let cachedClient: S3Client | null = null;

function getS3Client(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({ region: process.env.AWS_REGION });
  }
  return cachedClient;
}

// Read lazily (called from uploadDocumentToS3 below), matching the pattern in connectDB.ts/jwt.ts —
// see those files for why a top-level `process.env` read is unsafe on this hosting platform.
function getBucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Missing S3_BUCKET_NAME environment variable — set it in .env.local");
  return bucket;
}

export async function uploadDocumentToS3(
  body: Buffer,
  key: string,
  contentType: string,
): Promise<{ bucket: string; key: string }> {
  const bucket = getBucketName();
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { bucket, key };
}

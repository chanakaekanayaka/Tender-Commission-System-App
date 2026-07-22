import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const IMAGE_URL_EXPIRY_SECONDS = 3600;

/** The bucket holds sensitive tender documents, so it stays private — item images are read back
 *  via a short-lived signed URL instead of a public bucket ACL. Regenerated on every page render,
 *  so callers should treat the returned URL as ephemeral, never persist it. */
export async function getSignedImageUrl(key: string): Promise<string> {
  const bucket = getBucketName();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn: IMAGE_URL_EXPIRY_SECONDS });
}

/** Downloads an object's bytes directly — used server-side to embed an item image into a
 *  generated PDF (pdfkit needs the actual bytes, not a URL). */
export async function getObjectBuffer(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const bucket = getBucketName();
  const result = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await result.Body!.transformToByteArray();
  return { buffer: Buffer.from(bytes), contentType: result.ContentType };
}

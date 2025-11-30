import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const S3UploadInputSchema = z.object({
  integrationId: z.string().optional(),
  bucket: z.string().min(1, "Bucket name is required"),
  key: z.string().min(1, "Object key is required"),
  content: z.string().min(1, "Content is required"),
  contentType: z.string().optional().default("text/plain"),
});

// Result schema
const S3UploadResultSchema = z.object({
  success: z.boolean(),
  bucket: z.string(),
  key: z.string(),
  url: z.string(),
  etag: z.string().optional(),
  error: z.string().optional(),
});

export type S3UploadInput = StepInput & z.infer<typeof S3UploadInputSchema>;
export type S3UploadResult = z.infer<typeof S3UploadResultSchema>;

async function s3Upload(input: S3UploadInput): Promise<S3UploadResult> {
  // Validate input with Zod
  const validation = S3UploadInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      bucket: input.bucket || "",
      key: input.key || "",
      url: "",
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { bucket, key, content, contentType, integrationId } = validation.data;

  // Fetch AWS credentials
  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (!(credentials.AWS_ACCESS_KEY_ID && credentials.AWS_SECRET_ACCESS_KEY)) {
    return {
      success: false,
      bucket,
      key,
      url: "",
      error: "AWS credentials not configured",
    };
  }

  try {
    const region = credentials.AWS_REGION || "us-east-1";

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY,
      },
    });

    const response = await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: contentType || "text/plain",
      })
    );

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      success: true,
      bucket,
      key,
      url,
      etag: response.ETag,
    };
  } catch (error) {
    return {
      success: false,
      bucket,
      key,
      url: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function s3UploadStep(
  input: S3UploadInput
): Promise<S3UploadResult> {
  "use step";
  return await withStepLogging(input, () => s3Upload(input));
}

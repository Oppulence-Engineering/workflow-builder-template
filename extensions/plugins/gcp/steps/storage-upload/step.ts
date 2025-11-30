import "server-only";

import { Storage } from "@google-cloud/storage";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const StorageUploadInputSchema = z.object({
  integrationId: z.string().optional(),
  bucket: z.string().min(1, "Bucket name is required"),
  path: z.string().min(1, "File path is required"),
  content: z.string().min(1, "Content is required"),
  contentType: z.string().optional().default("text/plain"),
  makePublic: z.boolean().optional().default(false),
});

// Result schema
const StorageUploadResultSchema = z.object({
  success: z.boolean(),
  bucket: z.string(),
  path: z.string(),
  url: z.string(),
  generation: z.string().optional(),
  error: z.string().optional(),
});

export type StorageUploadInput = StepInput &
  z.infer<typeof StorageUploadInputSchema>;
export type StorageUploadResult = z.infer<typeof StorageUploadResultSchema>;

async function storageUpload(
  input: StorageUploadInput
): Promise<StorageUploadResult> {
  // Validate input with Zod
  const validation = StorageUploadInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      bucket: input.bucket || "",
      path: input.path || "",
      url: "",
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { bucket, path, content, contentType, makePublic, integrationId } =
    validation.data;

  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (
    !(
      credentials.GCP_PROJECT_ID &&
      credentials.GOOGLE_APPLICATION_CREDENTIALS_JSON
    )
  ) {
    return {
      success: false,
      bucket,
      path,
      url: "",
      error: "GCP credentials not configured",
    };
  }

  try {
    // Parse and validate service account credentials
    let serviceAccountKey: Record<string, unknown>;
    try {
      const parsed = JSON.parse(
        credentials.GOOGLE_APPLICATION_CREDENTIALS_JSON
      );
      // Validate that it's an object
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return {
          success: false,
          bucket,
          path,
          url: "",
          error: "Service account key must be a JSON object",
        };
      }
      // Validate required fields for GCP service account
      if (!parsed.private_key || typeof parsed.private_key !== "string") {
        return {
          success: false,
          bucket,
          path,
          url: "",
          error: "Service account key missing required 'private_key' field",
        };
      }
      if (!parsed.client_email || typeof parsed.client_email !== "string") {
        return {
          success: false,
          bucket,
          path,
          url: "",
          error: "Service account key missing required 'client_email' field",
        };
      }
      serviceAccountKey = parsed;
    } catch {
      return {
        success: false,
        bucket,
        path,
        url: "",
        error: "Invalid service account key JSON",
      };
    }

    const storage = new Storage({
      credentials: serviceAccountKey,
      projectId: credentials.GCP_PROJECT_ID,
    });

    const bucketRef = storage.bucket(bucket);
    const file = bucketRef.file(path);

    // Upload the content
    await file.save(content, {
      contentType: contentType || "text/plain",
      resumable: false,
    });

    // Optionally make the file public
    if (makePublic) {
      await file.makePublic();
    }

    // Get file metadata for generation
    const [metadata] = await file.getMetadata();

    const url = makePublic
      ? `https://storage.googleapis.com/${bucket}/${path}`
      : `gs://${bucket}/${path}`;

    return {
      success: true,
      bucket,
      path,
      url,
      generation: metadata?.generation?.toString(),
    };
  } catch (error) {
    return {
      success: false,
      bucket,
      path,
      url: "",
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

export async function storageUploadStep(
  input: StorageUploadInput
): Promise<StorageUploadResult> {
  "use step";
  return withStepLogging(input, () => storageUpload(input));
}

import "server-only";

import { BlobServiceClient } from "@azure/storage-blob";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const BlobUploadInputSchema = z.object({
  integrationId: z.string().optional(),
  container: z.string().optional(),
  blobName: z.string().min(1, "Blob name is required"),
  content: z.string().min(1, "Content is required"),
  contentType: z.string().optional().default("text/plain"),
  createContainer: z.boolean().optional().default(false),
});

// Result schema
const BlobUploadResultSchema = z.object({
  success: z.boolean(),
  container: z.string(),
  blobName: z.string(),
  url: z.string(),
  etag: z.string().optional(),
  error: z.string().optional(),
});

export type BlobUploadInput = StepInput & z.infer<typeof BlobUploadInputSchema>;
export type BlobUploadResult = z.infer<typeof BlobUploadResultSchema>;

async function blobUpload(input: BlobUploadInput): Promise<BlobUploadResult> {
  // Validate input with Zod
  const validation = BlobUploadInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      container: input.container || "",
      blobName: input.blobName || "",
      url: "",
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const {
    container,
    blobName,
    content,
    contentType,
    createContainer,
    integrationId,
  } = validation.data;

  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (!credentials.AZURE_STORAGE_CONNECTION_STRING) {
    return {
      success: false,
      container: container || "",
      blobName,
      url: "",
      error: "Azure credentials not configured",
    };
  }

  const containerName = container || credentials.AZURE_CONTAINER || "default";

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      credentials.AZURE_STORAGE_CONNECTION_STRING
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if requested and it doesn't exist
    if (createContainer) {
      await containerClient.createIfNotExists();
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the content
    const uploadResponse = await blockBlobClient.upload(
      content,
      Buffer.byteLength(content),
      {
        blobHTTPHeaders: {
          blobContentType: contentType || "text/plain",
        },
      }
    );

    return {
      success: true,
      container: containerName,
      blobName,
      url: blockBlobClient.url,
      etag: uploadResponse.etag,
    };
  } catch (error) {
    return {
      success: false,
      container: containerName,
      blobName,
      url: "",
      error: error instanceof Error ? error.message : "Failed to upload blob",
    };
  }
}

export async function blobUploadStep(
  input: BlobUploadInput
): Promise<BlobUploadResult> {
  "use step";
  return await withStepLogging(input, () => blobUpload(input));
}

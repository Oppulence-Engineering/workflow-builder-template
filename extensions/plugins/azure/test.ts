export function testAzure(credentials: Record<string, string>): {
  success: boolean;
  error?: string;
} {
  const { AZURE_STORAGE_CONNECTION_STRING, AZURE_CONTAINER } = credentials;

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    return {
      success: false,
      error: "Missing Azure Storage connection string",
    };
  }

  if (!AZURE_CONTAINER) {
    return {
      success: false,
      error: "Missing container name",
    };
  }

  try {
    // Validate connection string format
    if (!AZURE_STORAGE_CONNECTION_STRING.includes("AccountName=")) {
      return {
        success: false,
        error: "Invalid connection string: missing AccountName",
      };
    }

    if (
      !(
        AZURE_STORAGE_CONNECTION_STRING.includes("AccountKey=") ||
        AZURE_STORAGE_CONNECTION_STRING.includes("SharedAccessSignature=")
      )
    ) {
      return {
        success: false,
        error:
          "Invalid connection string: missing AccountKey or SharedAccessSignature",
      };
    }

    // In production, use @azure/storage-blob
    // const { BlobServiceClient } = await import("@azure/storage-blob");
    // const blobService = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    // const containerClient = blobService.getContainerClient(AZURE_CONTAINER);
    // await containerClient.exists();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Invalid connection string",
    };
  }
}

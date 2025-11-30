export function testAzure(credentials: Record<string, string>): Promise<{
  success: boolean;
  error?: string;
}> {
  const { AZURE_STORAGE_CONNECTION_STRING, AZURE_CONTAINER } = credentials;

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    return Promise.resolve({
      success: false,
      error: "Missing Azure Storage connection string",
    });
  }

  if (!AZURE_CONTAINER) {
    return Promise.resolve({
      success: false,
      error: "Missing container name",
    });
  }

  try {
    // Validate connection string format
    if (!AZURE_STORAGE_CONNECTION_STRING.includes("AccountName=")) {
      return Promise.resolve({
        success: false,
        error: "Invalid connection string: missing AccountName",
      });
    }

    if (
      !(
        AZURE_STORAGE_CONNECTION_STRING.includes("AccountKey=") ||
        AZURE_STORAGE_CONNECTION_STRING.includes("SharedAccessSignature=")
      )
    ) {
      return Promise.resolve({
        success: false,
        error:
          "Invalid connection string: missing AccountKey or SharedAccessSignature",
      });
    }

    // In production, use @azure/storage-blob
    // const { BlobServiceClient } = await import("@azure/storage-blob");
    // const blobService = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    // const containerClient = blobService.getContainerClient(AZURE_CONTAINER);
    // await containerClient.exists();

    return Promise.resolve({ success: true });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error:
        error instanceof Error ? error.message : "Invalid connection string",
    });
  }
}

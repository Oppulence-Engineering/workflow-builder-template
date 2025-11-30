export async function testGCP(
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const { GCP_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS_JSON } = credentials;

  if (!GCP_PROJECT_ID) {
    return {
      success: false,
      error: "Missing GCP Project ID",
    };
  }

  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return {
      success: false,
      error: "Missing Service Account Key",
    };
  }

  try {
    // Validate JSON format
    const parsed = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);

    if (parsed.type !== "service_account") {
      return {
        success: false,
        error: "Invalid service account key: type must be 'service_account'",
      };
    }

    if (!(parsed.project_id && parsed.private_key && parsed.client_email)) {
      return {
        success: false,
        error: "Invalid service account key: missing required fields",
      };
    }

    // In production, use @google-cloud/storage to verify
    // const { Storage } = await import("@google-cloud/storage");
    // const storage = new Storage({ credentials: parsed, projectId: GCP_PROJECT_ID });
    // await storage.getBuckets();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid service account key JSON",
    };
  }
}

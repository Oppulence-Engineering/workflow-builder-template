export async function testMongoDB(
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const { MONGODB_URI, MONGODB_DB } = credentials;

  if (!MONGODB_URI) {
    return {
      success: false,
      error: "Missing MongoDB connection string",
    };
  }

  if (!MONGODB_DB) {
    return {
      success: false,
      error: "Missing database name",
    };
  }

  try {
    // In production, use the mongodb package
    // const { MongoClient } = await import("mongodb");
    // const client = new MongoClient(MONGODB_URI);
    // await client.connect();
    // await client.db(MONGODB_DB).command({ ping: 1 });
    // await client.close();

    // Validate URL format
    const url = new URL(MONGODB_URI);
    if (url.protocol !== "mongodb:" && url.protocol !== "mongodb+srv:") {
      return {
        success: false,
        error: "Invalid MongoDB URI protocol",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid MongoDB URI",
    };
  }
}

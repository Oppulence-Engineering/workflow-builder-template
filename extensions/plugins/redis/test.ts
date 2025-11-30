/**
 * Test Redis credentials by validating the URL format
 * Note: Actual connection testing happens server-side in the step function
 */
export function testRedis(credentials: Record<string, string>): Promise<{
  success: boolean;
  error?: string;
}> {
  const { REDIS_URL } = credentials;

  if (!REDIS_URL) {
    return Promise.resolve({
      success: false,
      error: "Missing Redis URL",
    });
  }

  // Validate URL format
  try {
    const url = new URL(REDIS_URL);
    if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
      return Promise.resolve({
        success: false,
        error: "Invalid Redis URL protocol. Use redis:// or rediss://",
      });
    }

    // Validate required parts
    if (!url.hostname) {
      return Promise.resolve({
        success: false,
        error: "Redis URL missing hostname",
      });
    }

    return Promise.resolve({ success: true });
  } catch {
    return Promise.resolve({
      success: false,
      error:
        "Invalid Redis URL format. Use redis://[[user]:password@]host[:port][/db]",
    });
  }
}

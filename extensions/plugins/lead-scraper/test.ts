/**
 * Lead Scraper connection test
 * Validates the API endpoint is reachable and credentials are valid
 */
export async function testLeadScraper(
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const endpoint = credentials.LEAD_SCRAPER_API_ENDPOINT;
  const orgId = credentials.LEAD_SCRAPER_ORG_ID;
  const tenantId = credentials.LEAD_SCRAPER_TENANT_ID;
  const accountId = credentials.LEAD_SCRAPER_ACCOUNT_ID;

  // Validate required fields
  if (!endpoint) {
    return {
      success: false,
      error: "API Endpoint is required",
    };
  }

  if (!orgId) {
    return {
      success: false,
      error: "Organization ID is required",
    };
  }

  if (!tenantId) {
    return {
      success: false,
      error: "Tenant ID is required",
    };
  }

  if (!accountId) {
    return {
      success: false,
      error: "Account ID is required",
    };
  }

  // Validate endpoint URL format
  try {
    new URL(endpoint);
  } catch {
    return {
      success: false,
      error: "Invalid API endpoint URL format",
    };
  }

  // Test connection by calling a lightweight endpoint
  try {
    const response = await fetch(
      `${endpoint}/lead-scraper-microservice/api/v1/organizations?pageSize=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(credentials.LEAD_SCRAPER_API_KEY && {
            Authorization: `Bearer ${credentials.LEAD_SCRAPER_API_KEY}`,
          }),
        },
        signal: AbortSignal.timeout(10_000), // 10 second timeout
      }
    );

    if (response.ok) {
      return { success: true };
    }

    // Check for specific error codes
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: "Authentication failed - check your API key",
      };
    }

    if (response.status === 404) {
      // 404 might mean the endpoint is correct but the resource doesn't exist
      // This is still a successful connection test
      return { success: true };
    }

    return {
      success: false,
      error: `API returned status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return {
          success: false,
          error: "Connection timeout - check the API endpoint",
        };
      }
      if (error.message.includes("fetch")) {
        return {
          success: false,
          error: "Cannot reach API - check the endpoint URL",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Unknown error occurred",
    };
  }
}

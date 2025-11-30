import "server-only";
import {
  Configuration,
  LeadScraperServiceApi,
} from "@playbookmedia/backend-client-sdk";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema
const DownloadResultsInputSchema = z.object({
  integrationId: z.string().optional(),
  jobId: z.string().min(1, "Job ID is required"),
});

// Result schema
const DownloadResultsResultSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  filename: z.string().optional(),
  contentType: z.string().optional(),
  error: z.string().optional(),
});

export type DownloadResultsInput = StepInput &
  z.infer<typeof DownloadResultsInputSchema>;
export type DownloadResultsResult = z.infer<typeof DownloadResultsResultSchema>;

async function downloadResults(
  input: DownloadResultsInput
): Promise<DownloadResultsResult> {
  // Validate input
  const validation = DownloadResultsInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { integrationId, jobId } = validation.data;

  // Fetch credentials
  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  const endpoint = credentials.LEAD_SCRAPER_API_ENDPOINT;
  const orgId = credentials.LEAD_SCRAPER_ORG_ID;
  const tenantId = credentials.LEAD_SCRAPER_TENANT_ID;
  const accountId = credentials.LEAD_SCRAPER_ACCOUNT_ID;

  if (!(endpoint && orgId && tenantId && accountId)) {
    return {
      success: false,
      error: "Lead Scraper credentials not configured",
    };
  }

  try {
    // Initialize API client
    const config = new Configuration({
      basePath: endpoint,
      headers: credentials.LEAD_SCRAPER_API_KEY
        ? { Authorization: `Bearer ${credentials.LEAD_SCRAPER_API_KEY}` }
        : undefined,
    });
    const api = new LeadScraperServiceApi(config);

    // Download scraping results
    const response = await api.downloadScrapingResults({
      jobId,
      userId: accountId,
      orgId,
      tenantId,
    });

    return {
      success: true,
      content: response.content,
      filename: response.filename,
      contentType: response.contentType,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function downloadResultsStep(
  input: DownloadResultsInput
): Promise<DownloadResultsResult> {
  "use step";
  return await withStepLogging(input, () => downloadResults(input));
}

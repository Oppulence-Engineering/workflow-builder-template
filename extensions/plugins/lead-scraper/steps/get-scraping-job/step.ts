import "server-only";
import {
  Configuration,
  LeadScraperServiceApi,
} from "@playbookmedia/backend-client-sdk";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema
const GetScrapingJobInputSchema = z.object({
  integrationId: z.string().optional(),
  jobId: z.string().min(1, "Job ID is required"),
});

// Result schema
const GetScrapingJobResultSchema = z.object({
  success: z.boolean(),
  jobId: z.string().optional(),
  status: z.string().optional(),
  name: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  leadCount: z.number().optional(),
  leads: z.array(z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  error: z.string().optional(),
});

export type GetScrapingJobInput = StepInput &
  z.infer<typeof GetScrapingJobInputSchema>;
export type GetScrapingJobResult = z.infer<typeof GetScrapingJobResultSchema>;

async function getScrapingJob(
  input: GetScrapingJobInput
): Promise<GetScrapingJobResult> {
  // Validate input
  const validation = GetScrapingJobInputSchema.safeParse(input);
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
  const workspaceId = credentials.LEAD_SCRAPER_WORKSPACE_ID;

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

    // Get scraping job
    const response = await api.getScrapingJob({
      jobId,
      userId: accountId,
      orgId,
      tenantId,
      workspaceId: workspaceId || undefined,
    });

    const job = response.job;

    return {
      success: true,
      jobId: job?.id,
      status: job?.status,
      name: job?.name,
      keywords: job?.keywords,
      leadCount: job?.leads?.length,
      leads: job?.leads,
      createdAt: job?.createdAt?.toISOString(),
      updatedAt: job?.updatedAt?.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getScrapingJobStep(
  input: GetScrapingJobInput
): Promise<GetScrapingJobResult> {
  "use step";
  return await withStepLogging(input, () => getScrapingJob(input));
}

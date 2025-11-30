import "server-only";
import {
  Configuration,
  LeadScraperServiceApi,
} from "@playbookmedia/backend-client-sdk";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema
const CreateScrapingJobInputSchema = z.object({
  integrationId: z.string().optional(),
  name: z.string().min(1, "Job name is required"),
  keywords: z.string().min(1, "Keywords are required"),
  lang: z.string().default("en"),
  lat: z.string().optional(),
  lon: z.string().optional(),
  radius: z.coerce.number().optional(),
  email: z.coerce.boolean().default(true),
  fastMode: z.coerce.boolean().default(false),
  depth: z.coerce.number().optional(),
  maxTime: z.coerce.number().optional(),
});

// Result schema
const CreateScrapingJobResultSchema = z.object({
  success: z.boolean(),
  jobId: z.string().optional(),
  status: z.string().optional(),
  error: z.string().optional(),
});

export type CreateScrapingJobInput = StepInput &
  z.infer<typeof CreateScrapingJobInputSchema>;
export type CreateScrapingJobResult = z.infer<
  typeof CreateScrapingJobResultSchema
>;

async function createScrapingJob(
  input: CreateScrapingJobInput
): Promise<CreateScrapingJobResult> {
  // Validate input
  const validation = CreateScrapingJobInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const {
    integrationId,
    name,
    keywords,
    lang,
    lat,
    lon,
    radius,
    email,
    fastMode,
    depth,
    maxTime,
  } = validation.data;

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

    // Parse keywords (comma-separated to array)
    const keywordsArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Create scraping job
    const response = await api.createScrapingJob({
      createScrapingJobRequest: {
        authPlatformUserId: accountId,
        orgId,
        tenantId,
        workspaceId: workspaceId || undefined,
        name,
        keywords: keywordsArray,
        lang,
        lat: lat || undefined,
        lon: lon || undefined,
        radius: radius || undefined,
        email,
        fastMode,
        depth: depth || undefined,
        maxTime: maxTime || undefined,
      },
    });

    return {
      success: true,
      jobId: response.jobId,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function createScrapingJobStep(
  input: CreateScrapingJobInput
): Promise<CreateScrapingJobResult> {
  "use step";
  return await withStepLogging(input, () => createScrapingJob(input));
}

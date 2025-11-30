import "server-only";
import {
  Configuration,
  GetLeadStatsTimeRangeEnum,
  LeadScraperServiceApi,
} from "@playbookmedia/backend-client-sdk";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema
const GetLeadStatsInputSchema = z.object({
  integrationId: z.string().optional(),
  timeRange: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

// Result schema
const GetLeadStatsResultSchema = z.object({
  success: z.boolean(),
  totalLeads: z.string().optional(),
  newLeadsToday: z.string().optional(),
  newLeadsThisWeek: z.string().optional(),
  newLeadsThisMonth: z.string().optional(),
  averageGoogleRating: z.number().optional(),
  leadsWithPhone: z.string().optional(),
  leadsWithEmail: z.string().optional(),
  leadsWithWebsite: z.string().optional(),
  leadsByCity: z.array(z.unknown()).optional(),
  leadsByState: z.array(z.unknown()).optional(),
  leadsByCountry: z.array(z.unknown()).optional(),
  topIndustries: z.array(z.unknown()).optional(),
  error: z.string().optional(),
});

export type GetLeadStatsInput = StepInput &
  z.infer<typeof GetLeadStatsInputSchema>;
export type GetLeadStatsResult = z.infer<typeof GetLeadStatsResultSchema>;

async function getLeadStats(
  input: GetLeadStatsInput
): Promise<GetLeadStatsResult> {
  // Validate input
  const validation = GetLeadStatsInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { integrationId, timeRange, city, state, country } = validation.data;

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

  if (!workspaceId) {
    return {
      success: false,
      error: "Workspace ID is required for lead stats",
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

    // Map time range
    let mappedTimeRange: GetLeadStatsTimeRangeEnum | undefined;
    if (timeRange) {
      const timeRangeMap: Record<string, GetLeadStatsTimeRangeEnum> = {
        today: GetLeadStatsTimeRangeEnum.Today,
        this_week: GetLeadStatsTimeRangeEnum.ThisWeek,
        this_month: GetLeadStatsTimeRangeEnum.ThisMonth,
        this_quarter: GetLeadStatsTimeRangeEnum.ThisQuarter,
        this_year: GetLeadStatsTimeRangeEnum.ThisYear,
        all_time: GetLeadStatsTimeRangeEnum.AllTime,
      };
      mappedTimeRange = timeRangeMap[timeRange];
    }

    // Get lead stats
    const response = await api.getLeadStats({
      workspaceId,
      organizationId: orgId,
      tenantId,
      accountId,
      timeRange: mappedTimeRange,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
    });

    return {
      success: true,
      totalLeads: response.totalLeads,
      newLeadsToday: response.newLeadsToday,
      newLeadsThisWeek: response.newLeadsThisWeek,
      newLeadsThisMonth: response.newLeadsThisMonth,
      averageGoogleRating: response.averageGoogleRating,
      leadsWithPhone: response.leadsWithPhone,
      leadsWithEmail: response.leadsWithEmail,
      leadsWithWebsite: response.leadsWithWebsite,
      leadsByCity: response.leadsByCity,
      leadsByState: response.leadsByState,
      leadsByCountry: response.leadsByCountry,
      topIndustries: response.topIndustries,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getLeadStatsStep(
  input: GetLeadStatsInput
): Promise<GetLeadStatsResult> {
  "use step";
  return withStepLogging(input, () => getLeadStats(input));
}

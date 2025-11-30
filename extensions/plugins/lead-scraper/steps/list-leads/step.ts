import "server-only";
import {
  Configuration,
  LeadScraperServiceApi,
  ListLeadsSortOptionDirectionEnum,
  ListLeadsSortOptionFieldEnum,
} from "@playbookmedia/backend-client-sdk";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema
const ListLeadsInputSchema = z.object({
  integrationId: z.string().optional(),
  searchQuery: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minGoogleRating: z.coerce.number().min(0).max(5).optional(),
  maxGoogleRating: z.coerce.number().min(0).max(5).optional(),
  minReviewCount: z.coerce.number().min(0).optional(),
  requireEmail: z.coerce.boolean().optional(),
  requirePhone: z.coerce.boolean().optional(),
  requireWebsite: z.coerce.boolean().optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  pageNumber: z.coerce.number().min(1).default(1),
  sortField: z.string().optional(),
  sortDirection: z.string().optional(),
});

// Result schema
const ListLeadsResultSchema = z.object({
  success: z.boolean(),
  leads: z.array(z.unknown()).optional(),
  totalCount: z.number().optional(),
  nextPageNumber: z.number().optional(),
  error: z.string().optional(),
});

export type ListLeadsInput = StepInput & z.infer<typeof ListLeadsInputSchema>;
export type ListLeadsResult = z.infer<typeof ListLeadsResultSchema>;

async function listLeads(input: ListLeadsInput): Promise<ListLeadsResult> {
  // Validate input
  const validation = ListLeadsInputSchema.safeParse(input);
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
    searchQuery,
    city,
    state,
    country,
    minGoogleRating,
    maxGoogleRating,
    minReviewCount,
    requireEmail,
    requirePhone,
    requireWebsite,
    pageSize,
    pageNumber,
    sortField,
    sortDirection,
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

    // Map sort field
    let mappedSortField: ListLeadsSortOptionFieldEnum | undefined;
    if (sortField) {
      const sortFieldMap: Record<string, ListLeadsSortOptionFieldEnum> = {
        created_at: ListLeadsSortOptionFieldEnum.CreatedAt,
        google_rating: ListLeadsSortOptionFieldEnum.GoogleRating,
        review_count: ListLeadsSortOptionFieldEnum.ReviewCount,
        name: ListLeadsSortOptionFieldEnum.Name,
      };
      mappedSortField = sortFieldMap[sortField];
    }

    // Map sort direction
    let mappedSortDirection: ListLeadsSortOptionDirectionEnum | undefined;
    if (sortDirection) {
      const sortDirectionMap: Record<string, ListLeadsSortOptionDirectionEnum> =
        {
          asc: ListLeadsSortOptionDirectionEnum.Asc,
          desc: ListLeadsSortOptionDirectionEnum.Desc,
        };
      mappedSortDirection = sortDirectionMap[sortDirection];
    }

    // List leads
    const response = await api.listLeads({
      organizationId: orgId,
      workspaceId: workspaceId || undefined,
      tenantId,
      accountId,
      pageSize,
      pageNumber,
      filtersSearchQuery: searchQuery || undefined,
      filtersCity: city || undefined,
      filtersState: state || undefined,
      filtersCountry: country || undefined,
      filtersMinGoogleRating: minGoogleRating,
      filtersMaxGoogleRating: maxGoogleRating,
      filtersMinReviewCount: minReviewCount,
      filtersRequireContactEmail: requireEmail,
      filtersRequirePhoneNumber: requirePhone,
      filtersRequireWebsite: requireWebsite,
      sortOptionField: mappedSortField,
      sortOptionDirection: mappedSortDirection,
    });

    return {
      success: true,
      leads: response.leads,
      totalCount: response.totalCount,
      nextPageNumber: response.nextPageNumber,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function listLeadsStep(
  input: ListLeadsInput
): Promise<ListLeadsResult> {
  "use step";
  return withStepLogging(input, () => listLeads(input));
}

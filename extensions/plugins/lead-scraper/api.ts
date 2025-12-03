/**
 * Lead Scraper API Helper
 *
 * Provides functions for fetching organizations, tenants, accounts, and workspaces
 * from the Lead Scraper service using the official SDK.
 */

import {
  type Account,
  Configuration,
  LeadScraperServiceApi,
  type Organization,
  type Tenant,
  type Workspace,
} from "@playbookmedia/backend-client-sdk";

export type {
  Account,
  Organization,
  Tenant,
  Workspace,
} from "@playbookmedia/backend-client-sdk";

const TRAILING_SLASH_REGEX = /\/$/;

function createApiClient(
  endpoint: string,
  apiKey?: string
): LeadScraperServiceApi {
  const config = new Configuration({
    basePath: endpoint.replace(TRAILING_SLASH_REGEX, ""),
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  return new LeadScraperServiceApi(config);
}

export async function testConnection(
  endpoint: string,
  apiKey: string
): Promise<boolean> {
  try {
    const url = `${endpoint.replace(TRAILING_SLASH_REGEX, "")}/api/v1/health`;
    const response = await fetch(url, {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchOrganizations(
  endpoint: string,
  apiKey: string
): Promise<Organization[]> {
  const api = createApiClient(endpoint, apiKey);
  const response = await api.listOrganizations({});
  return response.organizations || [];
}

export async function fetchTenants(
  endpoint: string,
  apiKey: string,
  organizationId: string
): Promise<Tenant[]> {
  const api = createApiClient(endpoint, apiKey);
  const response = await api.listTenants({ organizationId });
  return response.tenants || [];
}

export async function fetchAccounts(
  endpoint: string,
  apiKey: string,
  tenantId: string,
  organizationId?: string
): Promise<Account[]> {
  const api = createApiClient(endpoint, apiKey);
  const response = await api.listAccounts({ tenantId, organizationId });
  return response.accounts || [];
}

type FetchWorkspacesInput = {
  endpoint: string;
  apiKey: string;
  accountId: string;
  organizationId?: string;
  tenantId?: string;
};

export async function fetchWorkspaces({
  endpoint,
  apiKey,
  accountId,
  organizationId,
  tenantId,
}: FetchWorkspacesInput): Promise<Workspace[]> {
  const api = createApiClient(endpoint, apiKey);
  const response = await api.listWorkspaces({
    accountId,
    organizationId,
    tenantId,
  });
  return response.workspaces || [];
}

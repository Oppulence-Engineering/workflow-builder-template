import { BarChart3, Download, Eye, Play, Search } from "lucide-react";
import type { IntegrationPlugin } from "@/plugins/registry";
import { registerIntegration } from "@/plugins/registry";
import { createScrapingJobCodegenTemplate } from "./codegen/create-scraping-job";
import { downloadResultsCodegenTemplate } from "./codegen/download-results";
import { getLeadStatsCodegenTemplate } from "./codegen/get-lead-stats";
import { getScrapingJobCodegenTemplate } from "./codegen/get-scraping-job";
import { listLeadsCodegenTemplate } from "./codegen/list-leads";
import { LeadScraperSettings } from "./settings";
import { CreateScrapingJobConfigFields } from "./steps/create-scraping-job/config";
import { DownloadResultsConfigFields } from "./steps/download-results/config";
import { GetLeadStatsConfigFields } from "./steps/get-lead-stats/config";
import { GetScrapingJobConfigFields } from "./steps/get-scraping-job/config";
import { ListLeadsConfigFields } from "./steps/list-leads/config";

const leadScraperPlugin: IntegrationPlugin = {
  type: "lead-scraper" as const,
  label: "Lead Scraper",
  description: "Lead scraping and search integration",

  icon: Search,

  settingsComponent: LeadScraperSettings,

  formFields: [
    {
      id: "apiEndpoint",
      label: "API Endpoint",
      type: "text",
      placeholder: "http://lead-scraper:8080",
      configKey: "apiEndpoint",
      helpText: "Lead Scraper API base URL",
    },
    {
      id: "organizationId",
      label: "Organization ID",
      type: "text",
      placeholder: "org-xxx",
      configKey: "organizationId",
      helpText: "Your organization ID from the lead scraper system",
    },
    {
      id: "tenantId",
      label: "Tenant ID",
      type: "text",
      placeholder: "tenant-xxx",
      configKey: "tenantId",
      helpText: "Your tenant ID from the lead scraper system",
    },
    {
      id: "accountId",
      label: "Account ID",
      type: "text",
      placeholder: "account-xxx",
      configKey: "accountId",
      helpText: "Your account ID from the lead scraper system",
    },
    {
      id: "workspaceId",
      label: "Workspace ID (Optional)",
      type: "text",
      placeholder: "workspace-xxx",
      configKey: "workspaceId",
      helpText: "Optional workspace ID for scoping operations",
    },
    {
      id: "apiKey",
      label: "API Key (Optional)",
      type: "password",
      placeholder: "Your API key",
      configKey: "apiKey",
      helpText: "Optional API key for authentication",
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.apiEndpoint) {
      creds.LEAD_SCRAPER_API_ENDPOINT = String(config.apiEndpoint);
    }
    if (config.organizationId) {
      creds.LEAD_SCRAPER_ORG_ID = String(config.organizationId);
    }
    if (config.tenantId) {
      creds.LEAD_SCRAPER_TENANT_ID = String(config.tenantId);
    }
    if (config.accountId) {
      creds.LEAD_SCRAPER_ACCOUNT_ID = String(config.accountId);
    }
    if (config.workspaceId) {
      creds.LEAD_SCRAPER_WORKSPACE_ID = String(config.workspaceId);
    }
    if (config.apiKey) {
      creds.LEAD_SCRAPER_API_KEY = String(config.apiKey);
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testLeadScraper } = await import("./test");
      return testLeadScraper;
    },
  },

  actions: [
    {
      id: "Create Scraping Job",
      label: "Create Scraping Job",
      description: "Start a new lead scraping job with keywords and location",
      category: "Lead Scraper",
      icon: Play,
      stepFunction: "createScrapingJobStep",
      stepImportPath: "create-scraping-job",
      configFields: CreateScrapingJobConfigFields,
      codegenTemplate: createScrapingJobCodegenTemplate,
    },
    {
      id: "Get Scraping Job",
      label: "Get Scraping Job",
      description: "Check status and retrieve results of a scraping job",
      category: "Lead Scraper",
      icon: Eye,
      stepFunction: "getScrapingJobStep",
      stepImportPath: "get-scraping-job",
      configFields: GetScrapingJobConfigFields,
      codegenTemplate: getScrapingJobCodegenTemplate,
    },
    {
      id: "List Leads",
      label: "List Leads",
      description: "Search and filter existing leads",
      category: "Lead Scraper",
      icon: Search,
      stepFunction: "listLeadsStep",
      stepImportPath: "list-leads",
      configFields: ListLeadsConfigFields,
      codegenTemplate: listLeadsCodegenTemplate,
    },
    {
      id: "Get Lead Stats",
      label: "Get Lead Stats",
      description: "Get aggregate statistics about leads",
      category: "Lead Scraper",
      icon: BarChart3,
      stepFunction: "getLeadStatsStep",
      stepImportPath: "get-lead-stats",
      configFields: GetLeadStatsConfigFields,
      codegenTemplate: getLeadStatsCodegenTemplate,
    },
    {
      id: "Download Results",
      label: "Download Results",
      description: "Export scraping job results to file",
      category: "Lead Scraper",
      icon: Download,
      stepFunction: "downloadResultsStep",
      stepImportPath: "download-results",
      configFields: DownloadResultsConfigFields,
      codegenTemplate: downloadResultsCodegenTemplate,
    },
  ],
};

// Auto-register on import
registerIntegration(leadScraperPlugin);

export default leadScraperPlugin;

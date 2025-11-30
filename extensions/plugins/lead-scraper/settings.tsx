"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LeadScraperSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function LeadScraperSettings({
  config,
  onConfigChange,
}: LeadScraperSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lead-scraper-endpoint">API Endpoint</Label>
        <Input
          id="lead-scraper-endpoint"
          onChange={(e) => onConfigChange?.("apiEndpoint", e.target.value)}
          placeholder="http://lead-scraper:8080"
          type="text"
          value={config?.apiEndpoint || ""}
        />
        <p className="text-muted-foreground text-xs">
          Base URL for the Lead Scraper API
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-scraper-org-id">Organization ID</Label>
        <Input
          id="lead-scraper-org-id"
          onChange={(e) => onConfigChange?.("organizationId", e.target.value)}
          placeholder="org-xxx"
          type="text"
          value={config?.organizationId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-scraper-tenant-id">Tenant ID</Label>
        <Input
          id="lead-scraper-tenant-id"
          onChange={(e) => onConfigChange?.("tenantId", e.target.value)}
          placeholder="tenant-xxx"
          type="text"
          value={config?.tenantId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-scraper-account-id">Account ID</Label>
        <Input
          id="lead-scraper-account-id"
          onChange={(e) => onConfigChange?.("accountId", e.target.value)}
          placeholder="account-xxx"
          type="text"
          value={config?.accountId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-scraper-workspace-id">
          Workspace ID (Optional)
        </Label>
        <Input
          id="lead-scraper-workspace-id"
          onChange={(e) => onConfigChange?.("workspaceId", e.target.value)}
          placeholder="workspace-xxx"
          type="text"
          value={config?.workspaceId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-scraper-api-key">API Key (Optional)</Label>
        <Input
          id="lead-scraper-api-key"
          onChange={(e) => onConfigChange?.("apiKey", e.target.value)}
          placeholder="Your API key"
          type="password"
          value={config?.apiKey || ""}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Configure your Lead Scraper credentials. These IDs are provided by the
        lead scraper system administrator.
      </p>
    </div>
  );
}

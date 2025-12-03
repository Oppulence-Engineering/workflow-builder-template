"use client";

import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWizard } from "@/extensions/components/wizard/wizard-container";
import { fetchOrganizations, type Organization } from "../api";

type OrgStepProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
};

export function OrgStep({ config, onUpdateConfig }: OrgStepProps) {
  const { updateStepValidity } = useWizard();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = (config.apiEndpoint as string) || "";
  const apiKey = (config.apiKey as string) || "";
  const organizationId = (config.organizationId as string) || "";

  // Fetch organizations on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orgs = await fetchOrganizations(apiEndpoint, apiKey);
        setOrganizations(orgs);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load organizations"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (apiEndpoint) {
      loadOrganizations();
    }
  }, [apiEndpoint, apiKey]);

  // Validate step when selection changes
  useEffect(() => {
    const isValid = organizationId.trim().length > 0;
    updateStepValidity("organization", isValid);
  }, [organizationId, updateStepValidity]);

  const handleOrgChange = (value: string) => {
    onUpdateConfig("organizationId", value);
    // Clear dependent selections
    onUpdateConfig("tenantId", "");
    onUpdateConfig("accountId", "");
    onUpdateConfig("workspaceId", "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading organizations...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <p className="mt-2 text-muted-foreground text-xs">
          Please check your API endpoint and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organizationId">Organization</Label>
        <Select onValueChange={handleOrgChange} value={organizationId}>
          <SelectTrigger id="organizationId">
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id || ""}>
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>{org.name || org.displayName || org.id}</span>
                  {org.billingPlan && (
                    <span className="text-muted-foreground text-xs">
                      ({org.billingPlan})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Select the organization you want to configure
        </p>
      </div>

      {organizationId && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="font-medium text-sm">Selected Organization</p>
          <p className="mt-1 text-muted-foreground text-xs">
            ID: {organizationId}
          </p>
        </div>
      )}
    </div>
  );
}

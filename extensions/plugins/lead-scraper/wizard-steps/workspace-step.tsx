"use client";

import { Building2, FolderOpen, Loader2, Users, Wallet } from "lucide-react";
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
import { fetchWorkspaces, type Workspace } from "../api";

type WorkspaceStepProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
};

export function WorkspaceStep({ config, onUpdateConfig }: WorkspaceStepProps) {
  const { updateStepValidity } = useWizard();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = (config.apiEndpoint as string) || "";
  const apiKey = (config.apiKey as string) || "";
  const organizationId = (config.organizationId as string) || "";
  const tenantId = (config.tenantId as string) || "";
  const accountId = (config.accountId as string) || "";
  const workspaceId = (config.workspaceId as string) || "";

  // Fetch workspaces when account is selected
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!accountId) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWorkspaces({
          endpoint: apiEndpoint,
          apiKey,
          accountId,
        });
        setWorkspaces(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load workspaces");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, [apiEndpoint, apiKey, accountId]);

  // Mark step as valid (workspace is optional)
  useEffect(() => {
    // Workspace is optional, so this step is always valid if we reach it
    updateStepValidity("workspace", true);
  }, [updateStepValidity]);

  const handleWorkspaceChange = (value: string) => {
    onUpdateConfig("workspaceId", value === "none" ? "" : value);
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading workspaces...
          </span>
        </div>
      )}

      {!isLoading && error && (
        <div className="py-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {!(isLoading || error) && (
        <div className="space-y-2">
          <Label htmlFor="workspaceId">Workspace (Optional)</Label>
          <Select
            onValueChange={handleWorkspaceChange}
            value={workspaceId || "none"}
          >
            <SelectTrigger id="workspaceId">
              <SelectValue placeholder="Select a workspace (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">
                  No workspace (use all)
                </span>
              </SelectItem>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id || ""}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    <span>{workspace.name || workspace.id}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Optionally scope operations to a specific workspace
          </p>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="rounded-md border bg-muted/50 p-4">
        <h4 className="mb-3 font-medium text-sm">Configuration Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-24 text-muted-foreground">Endpoint:</span>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {apiEndpoint}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Organization:</span>
            <span>{organizationId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tenant:</span>
            <span>{tenantId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Account:</span>
            <span>{accountId}</span>
          </div>
          {workspaceId && (
            <div className="flex items-center gap-2">
              <FolderOpen className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Workspace:</span>
              <span>{workspaceId}</span>
            </div>
          )}
          {apiKey && (
            <div className="flex items-center gap-2">
              <span className="w-24 text-muted-foreground">API Key:</span>
              <span className="text-xs">••••••••</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

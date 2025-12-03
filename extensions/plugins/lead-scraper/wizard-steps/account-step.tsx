"use client";

import { Loader2, Users, Wallet } from "lucide-react";
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
import { type Account, fetchAccounts, fetchTenants, type Tenant } from "../api";

type AccountStepProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
};

export function AccountStep({ config, onUpdateConfig }: AccountStepProps) {
  const { updateStepValidity } = useWizard();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = (config.apiEndpoint as string) || "";
  const apiKey = (config.apiKey as string) || "";
  const organizationId = (config.organizationId as string) || "";
  const tenantId = (config.tenantId as string) || "";
  const accountId = (config.accountId as string) || "";

  // Fetch tenants when organization is selected
  useEffect(() => {
    const loadTenants = async () => {
      if (!organizationId) {
        return;
      }

      setIsLoadingTenants(true);
      setError(null);
      try {
        const data = await fetchTenants(apiEndpoint, apiKey, organizationId);
        setTenants(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load tenants");
      } finally {
        setIsLoadingTenants(false);
      }
    };

    loadTenants();
  }, [apiEndpoint, apiKey, organizationId]);

  // Fetch accounts when tenant is selected
  useEffect(() => {
    const loadAccounts = async () => {
      if (!tenantId) {
        setAccounts([]);
        return;
      }

      setIsLoadingAccounts(true);
      try {
        const data = await fetchAccounts(apiEndpoint, apiKey, tenantId);
        setAccounts(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load accounts");
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [apiEndpoint, apiKey, tenantId]);

  // Validate step when selections change
  useEffect(() => {
    const isValid = tenantId.trim().length > 0 && accountId.trim().length > 0;
    updateStepValidity("account", isValid);
  }, [tenantId, accountId, updateStepValidity]);

  const handleTenantChange = (value: string) => {
    onUpdateConfig("tenantId", value);
    // Clear dependent selections
    onUpdateConfig("accountId", "");
    onUpdateConfig("workspaceId", "");
  };

  const handleAccountChange = (value: string) => {
    onUpdateConfig("accountId", value);
    // Clear workspace selection
    onUpdateConfig("workspaceId", "");
  };

  if (isLoadingTenants) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tenants...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenantId">Tenant</Label>
        <Select onValueChange={handleTenantChange} value={tenantId}>
          <SelectTrigger id="tenantId">
            <SelectValue placeholder="Select a tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id || ""}>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{tenant.name || tenant.id}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Select the tenant within your organization
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Account</Label>
        <Select
          disabled={!tenantId || isLoadingAccounts}
          onValueChange={handleAccountChange}
          value={accountId}
        >
          <SelectTrigger id="accountId">
            {isLoadingAccounts ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading accounts...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select an account" />
            )}
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id || ""}>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" />
                  <span>
                    {account.email || account.authPlatformUserId || account.id}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Select the account within your tenant
        </p>
      </div>
    </div>
  );
}

"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizard } from "@/extensions/components/wizard/wizard-container";
import { testConnection } from "../api";

type ConnectStepProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
};

export function ConnectStep({ config, onUpdateConfig }: ConnectStepProps) {
  const { updateStepValidity } = useWizard();
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");

  const apiEndpoint = (config.apiEndpoint as string) || "";
  const apiKey = (config.apiKey as string) || "";

  // Validate step when endpoint changes
  useEffect(() => {
    const isValid =
      apiEndpoint.trim().length > 0 && connectionStatus === "success";
    updateStepValidity("connect", isValid);
  }, [apiEndpoint, connectionStatus, updateStepValidity]);

  const handleTestConnection = async () => {
    if (!apiEndpoint.trim()) {
      return;
    }

    setConnectionStatus("testing");
    try {
      const success = await testConnection(apiEndpoint, apiKey);
      setConnectionStatus(success ? "success" : "error");
    } catch {
      setConnectionStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apiEndpoint">API Endpoint</Label>
        <Input
          id="apiEndpoint"
          onChange={(e) => {
            onUpdateConfig("apiEndpoint", e.target.value);
            setConnectionStatus("idle");
          }}
          placeholder="http://lead-scraper:8080"
          type="text"
          value={apiEndpoint}
        />
        <p className="text-muted-foreground text-xs">
          The base URL for the Lead Scraper API service
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key (Optional)</Label>
        <Input
          id="apiKey"
          onChange={(e) => {
            onUpdateConfig("apiKey", e.target.value);
            setConnectionStatus("idle");
          }}
          placeholder="Your API key"
          type="password"
          value={apiKey}
        />
        <p className="text-muted-foreground text-xs">
          Optional API key for authentication
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          disabled={!apiEndpoint.trim() || connectionStatus === "testing"}
          onClick={handleTestConnection}
          type="button"
          variant="outline"
        >
          {connectionStatus === "testing" && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          Test Connection
        </Button>

        {connectionStatus === "success" && (
          <span className="flex items-center text-green-600 text-sm">
            <CheckCircle className="mr-1 size-4" />
            Connected
          </span>
        )}

        {connectionStatus === "error" && (
          <span className="flex items-center text-destructive text-sm">
            <XCircle className="mr-1 size-4" />
            Connection failed
          </span>
        )}
      </div>
    </div>
  );
}

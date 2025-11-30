"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AzureSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function AzureSettings({ config, onConfigChange }: AzureSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="azure-connection">Storage Connection String</Label>
        <Input
          id="azure-connection"
          onChange={(e) => onConfigChange?.("connectionString", e.target.value)}
          placeholder="DefaultEndpointsProtocol=https;AccountName=..."
          type="password"
          value={config?.connectionString || ""}
        />
        <p className="text-muted-foreground text-xs">
          Find in{" "}
          <a
            className="text-primary underline"
            href="https://portal.azure.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Azure Portal → Storage Account → Access Keys
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="azure-container">Default Container</Label>
        <Input
          id="azure-container"
          onChange={(e) => onConfigChange?.("containerName", e.target.value)}
          placeholder="my-container"
          type="text"
          value={config?.containerName || ""}
        />
      </div>
    </div>
  );
}

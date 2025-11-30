"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type GCPSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function GCPSettings({ config, onConfigChange }: GCPSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gcp-project">Project ID</Label>
        <Input
          id="gcp-project"
          onChange={(e) => onConfigChange?.("projectId", e.target.value)}
          placeholder="my-project-123"
          type="text"
          value={config?.projectId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gcp-key">Service Account Key (JSON)</Label>
        <TemplateBadgeTextarea
          id="gcp-key"
          onChange={(value) => onConfigChange?.("serviceAccountKey", value)}
          placeholder="Paste your service account JSON key here..."
          rows={6}
          value={config?.serviceAccountKey || ""}
        />
        <p className="text-muted-foreground text-xs">
          Download from{" "}
          <a
            className="text-primary underline"
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            rel="noopener noreferrer"
            target="_blank"
          >
            GCP Console → IAM → Service Accounts
          </a>
        </p>
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AWSSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function AWSSettings({ config, onConfigChange }: AWSSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="aws-access-key">Access Key ID</Label>
        <Input
          id="aws-access-key"
          onChange={(e) => onConfigChange?.("accessKeyId", e.target.value)}
          placeholder="AKIA..."
          type="text"
          value={config?.accessKeyId || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aws-secret-key">Secret Access Key</Label>
        <Input
          id="aws-secret-key"
          onChange={(e) => onConfigChange?.("secretAccessKey", e.target.value)}
          placeholder="Your secret key"
          type="password"
          value={config?.secretAccessKey || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aws-region">Default Region</Label>
        <Input
          id="aws-region"
          onChange={(e) => onConfigChange?.("region", e.target.value)}
          placeholder="us-east-1"
          type="text"
          value={config?.region || ""}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Create credentials in the{" "}
        <a
          className="text-primary underline"
          href="https://console.aws.amazon.com/iam/home#/security_credentials"
          rel="noopener noreferrer"
          target="_blank"
        >
          AWS IAM Console
        </a>
      </p>
    </div>
  );
}

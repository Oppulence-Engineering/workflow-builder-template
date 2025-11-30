"use client";

import { Label } from "@/components/ui/label";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function GetScrapingJobConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="get-job-id">Job ID</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="get-job-id"
          onChange={(value) => onUpdateConfig("jobId", value)}
          placeholder="job-xxx or {{previousNode.jobId}}"
          value={(config.jobId as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          The ID of the scraping job to retrieve. Use template variables to
          reference output from previous nodes.
        </p>
      </div>
    </div>
  );
}

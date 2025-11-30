"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function InvokeS3ConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="s3-bucket">Bucket Name</Label>
        <Input
          disabled={disabled}
          id="s3-bucket"
          onChange={(e) => onUpdateConfig("bucket", e.target.value)}
          placeholder="my-bucket"
          value={(config.bucket as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="s3-key">Object Key (Path)</Label>
        <Input
          disabled={disabled}
          id="s3-key"
          onChange={(e) => onUpdateConfig("key", e.target.value)}
          placeholder="path/to/file.txt"
          value={(config.key as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Use {"{{previousNode.output}}"} for dynamic paths
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="s3-content">Content</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="s3-content"
          onChange={(value) => onUpdateConfig("content", value)}
          placeholder="File content or {{previousNode.output}}"
          rows={4}
          value={(config.content as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="s3-content-type">Content Type (optional)</Label>
        <Input
          disabled={disabled}
          id="s3-content-type"
          onChange={(e) => onUpdateConfig("contentType", e.target.value)}
          placeholder="text/plain"
          value={(config.contentType as string) || ""}
        />
      </div>
    </div>
  );
}

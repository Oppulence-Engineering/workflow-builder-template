"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function StorageUploadConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gcs-bucket">Bucket Name</Label>
        <Input
          disabled={disabled}
          id="gcs-bucket"
          onChange={(e) => onUpdateConfig("bucket", e.target.value)}
          placeholder="my-bucket"
          value={(config.bucket as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gcs-path">Object Path</Label>
        <Input
          disabled={disabled}
          id="gcs-path"
          onChange={(e) => onUpdateConfig("path", e.target.value)}
          placeholder="folder/file.txt"
          value={(config.path as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gcs-content">Content</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="gcs-content"
          onChange={(value) => onUpdateConfig("content", value)}
          placeholder="File content or {{previousNode.output}}"
          rows={4}
          value={(config.content as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gcs-content-type">Content Type (optional)</Label>
        <Input
          disabled={disabled}
          id="gcs-content-type"
          onChange={(e) => onUpdateConfig("contentType", e.target.value)}
          placeholder="text/plain"
          value={(config.contentType as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            checked={config.makePublic as boolean}
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="gcs-make-public"
            onChange={(e) => onUpdateConfig("makePublic", e.target.checked)}
            type="checkbox"
          />
          <Label className="font-normal text-sm" htmlFor="gcs-make-public">
            Make public
          </Label>
        </div>
        <p className="text-muted-foreground text-xs">
          Makes the uploaded object publicly accessible
        </p>
      </div>
    </div>
  );
}

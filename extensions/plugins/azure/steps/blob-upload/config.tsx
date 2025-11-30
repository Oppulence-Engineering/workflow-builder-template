"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function BlobUploadConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="azure-container">Container (optional)</Label>
        <Input
          disabled={disabled}
          id="azure-container"
          onChange={(e) => onUpdateConfig("container", e.target.value)}
          placeholder="Uses default from settings if empty"
          value={(config.container as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="azure-blob-name">Blob Name</Label>
        <Input
          disabled={disabled}
          id="azure-blob-name"
          onChange={(e) => onUpdateConfig("blobName", e.target.value)}
          placeholder="folder/file.txt"
          value={(config.blobName as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="azure-content">Content</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="azure-content"
          onChange={(value) => onUpdateConfig("content", value)}
          placeholder="File content or {{previousNode.output}}"
          rows={4}
          value={(config.content as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="azure-content-type">Content Type (optional)</Label>
        <Input
          disabled={disabled}
          id="azure-content-type"
          onChange={(e) => onUpdateConfig("contentType", e.target.value)}
          placeholder="text/plain"
          value={(config.contentType as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            checked={config.createContainer as boolean}
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="azure-create-container"
            onChange={(e) =>
              onUpdateConfig("createContainer", e.target.checked)
            }
            type="checkbox"
          />
          <Label
            className="font-normal text-sm"
            htmlFor="azure-create-container"
          >
            Create container if not exists
          </Label>
        </div>
        <p className="text-muted-foreground text-xs">
          Automatically create the container if it doesn't exist
        </p>
      </div>
    </div>
  );
}

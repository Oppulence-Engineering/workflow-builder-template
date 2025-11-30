"use client";

import { Label } from "@/components/ui/label";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function GetValueConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="redis-key">Key</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="redis-key"
          onChange={(value) => onUpdateConfig("key", value)}
          placeholder="user:123 or {{previousNode.userId}}"
          value={(config.key as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          The Redis key to retrieve
        </p>
      </div>
    </div>
  );
}

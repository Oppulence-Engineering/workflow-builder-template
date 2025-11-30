"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function FindDocumentsConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mongodb-collection">Collection</Label>
        <Input
          disabled={disabled}
          id="mongodb-collection"
          onChange={(e) => onUpdateConfig("collection", e.target.value)}
          placeholder="users"
          value={(config.collection as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mongodb-filter">Filter (JSON)</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="mongodb-filter"
          onChange={(value) => onUpdateConfig("filter", value)}
          placeholder='{"status": "active"} or use {{previousNode.filter}}'
          rows={4}
          value={(config.filter as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          MongoDB query filter in JSON format
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mongodb-limit">Limit</Label>
        <Input
          disabled={disabled}
          id="mongodb-limit"
          max={1000}
          min={1}
          onChange={(e) =>
            onUpdateConfig("limit", Number.parseInt(e.target.value, 10) || 100)
          }
          placeholder="100"
          type="number"
          value={(config.limit as number) || 100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mongodb-skip">Skip</Label>
        <Input
          disabled={disabled}
          id="mongodb-skip"
          min={0}
          onChange={(e) =>
            onUpdateConfig("skip", Number.parseInt(e.target.value, 10) || 0)
          }
          placeholder="0"
          type="number"
          value={(config.skip as number) || 0}
        />
        <p className="text-muted-foreground text-xs">
          Number of documents to skip (for pagination)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mongodb-sort">Sort (JSON)</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="mongodb-sort"
          onChange={(value) => onUpdateConfig("sort", value)}
          placeholder='{"createdAt": -1, "name": 1}'
          rows={2}
          value={(config.sort as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Sort specification: 1 for ascending, -1 for descending
        </p>
      </div>
    </div>
  );
}

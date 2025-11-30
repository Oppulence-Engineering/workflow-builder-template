"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RedisSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function RedisSettings({ config, onConfigChange }: RedisSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="redis-url">Connection URL</Label>
        <Input
          id="redis-url"
          onChange={(e) => onConfigChange?.("url", e.target.value)}
          placeholder="redis://localhost:6379"
          type="password"
          value={config?.url || ""}
        />
        <p className="text-muted-foreground text-xs">
          Format: redis://[[user]:password@]host[:port][/db]
        </p>
      </div>
    </div>
  );
}

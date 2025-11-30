"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MongoDBSettingsProps = {
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
};

export function MongoDBSettings({
  config,
  onConfigChange,
}: MongoDBSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mongodb-uri">Connection String</Label>
        <Input
          id="mongodb-uri"
          onChange={(e) => onConfigChange?.("connectionString", e.target.value)}
          placeholder="mongodb://localhost:27017"
          type="password"
          value={config?.connectionString || ""}
        />
        <p className="text-muted-foreground text-xs">
          MongoDB connection URI (mongodb:// or mongodb+srv://)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mongodb-db">Database Name</Label>
        <Input
          id="mongodb-db"
          onChange={(e) => onConfigChange?.("database", e.target.value)}
          placeholder="mydb"
          type="text"
          value={config?.database || ""}
        />
      </div>
    </div>
  );
}

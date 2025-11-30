"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function GetLeadStatsConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stats-time-range">Time Range</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("timeRange", value)}
          value={(config.timeRange as string) || ""}
        >
          <SelectTrigger className="w-full" id="stats-time-range">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Time period for statistics calculation
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stats-city">City (Optional)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="stats-city"
            onChange={(value: string) => onUpdateConfig("city", value)}
            placeholder="Athens"
            value={(config.city as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stats-state">State (Optional)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="stats-state"
            onChange={(value: string) => onUpdateConfig("state", value)}
            placeholder="Attica"
            value={(config.state as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stats-country">Country (Optional)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="stats-country"
            onChange={(value: string) => onUpdateConfig("country", value)}
            placeholder="Greece"
            value={(config.country as string) || ""}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Filter statistics by location. Leave empty for all locations.
      </p>
    </div>
  );
}

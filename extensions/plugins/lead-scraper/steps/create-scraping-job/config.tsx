"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function CreateScrapingJobConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scraping-job-name">Job Name</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="scraping-job-name"
          onChange={(value) => onUpdateConfig("name", value)}
          placeholder="Coffee Shops in Athens"
          value={(config.name as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          A descriptive name for this scraping job
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scraping-keywords">Keywords</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="scraping-keywords"
          onChange={(value) => onUpdateConfig("keywords", value)}
          placeholder="coffee, cafe, espresso"
          rows={2}
          value={(config.keywords as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Comma-separated search keywords for Google Maps
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scraping-lat">Latitude</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="scraping-lat"
            onChange={(value) => onUpdateConfig("lat", value)}
            placeholder="37.9838"
            value={(config.lat as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scraping-lon">Longitude</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="scraping-lon"
            onChange={(value) => onUpdateConfig("lon", value)}
            placeholder="23.7275"
            value={(config.lon as string) || ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scraping-radius">Radius (km)</Label>
          <Input
            disabled={disabled}
            id="scraping-radius"
            onChange={(e) => onUpdateConfig("radius", e.target.value)}
            placeholder="10"
            type="number"
            value={(config.radius as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scraping-lang">Language</Label>
          <Input
            disabled={disabled}
            id="scraping-lang"
            onChange={(e) => onUpdateConfig("lang", e.target.value)}
            placeholder="en"
            type="text"
            value={(config.lang as string) || "en"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scraping-depth">Depth</Label>
          <Input
            disabled={disabled}
            id="scraping-depth"
            onChange={(e) => onUpdateConfig("depth", e.target.value)}
            placeholder="1"
            type="number"
            value={(config.depth as string) || ""}
          />
          <p className="text-muted-foreground text-xs">Scraping depth level</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scraping-max-time">Max Time (seconds)</Label>
          <Input
            disabled={disabled}
            id="scraping-max-time"
            onChange={(e) => onUpdateConfig("maxTime", e.target.value)}
            placeholder="300"
            type="number"
            value={(config.maxTime as string) || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            checked={(config.email as boolean) ?? true}
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="scraping-email"
            onChange={(e) => onUpdateConfig("email", e.target.checked)}
            type="checkbox"
          />
          <Label className="font-normal text-sm" htmlFor="scraping-email">
            Extract Emails
          </Label>
        </div>
        <p className="text-muted-foreground text-xs">
          Attempt to extract email addresses from results
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            checked={(config.fastMode as boolean) ?? false}
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="scraping-fast-mode"
            onChange={(e) => onUpdateConfig("fastMode", e.target.checked)}
            type="checkbox"
          />
          <Label className="font-normal text-sm" htmlFor="scraping-fast-mode">
            Fast Mode
          </Label>
        </div>
        <p className="text-muted-foreground text-xs">
          Enable faster scraping (may reduce result quality)
        </p>
      </div>
    </div>
  );
}

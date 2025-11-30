"use client";

import { Input } from "@/components/ui/input";
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

export function ListLeadsConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leads-search-query">Search Query</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="leads-search-query"
          onChange={(value: string) => onUpdateConfig("searchQuery", value)}
          placeholder="coffee shop"
          value={(config.searchQuery as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Free-text search across lead names and descriptions
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leads-city">City</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="leads-city"
            onChange={(value: string) => onUpdateConfig("city", value)}
            placeholder="Athens"
            value={(config.city as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leads-state">State/Region</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="leads-state"
            onChange={(value: string) => onUpdateConfig("state", value)}
            placeholder="Attica"
            value={(config.state as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leads-country">Country</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="leads-country"
            onChange={(value: string) => onUpdateConfig("country", value)}
            placeholder="Greece"
            value={(config.country as string) || ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leads-min-rating">Min Google Rating</Label>
          <Input
            disabled={disabled}
            id="leads-min-rating"
            max={5}
            min={0}
            onChange={(e) => onUpdateConfig("minGoogleRating", e.target.value)}
            placeholder="4.0"
            step={0.1}
            type="number"
            value={(config.minGoogleRating as string) || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leads-max-rating">Max Google Rating</Label>
          <Input
            disabled={disabled}
            id="leads-max-rating"
            max={5}
            min={0}
            onChange={(e) => onUpdateConfig("maxGoogleRating", e.target.value)}
            placeholder="5.0"
            step={0.1}
            type="number"
            value={(config.maxGoogleRating as string) || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leads-min-reviews">Min Review Count</Label>
        <Input
          disabled={disabled}
          id="leads-min-reviews"
          min={0}
          onChange={(e) => onUpdateConfig("minReviewCount", e.target.value)}
          placeholder="10"
          type="number"
          value={(config.minReviewCount as string) || ""}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              checked={(config.requireEmail as boolean) ?? false}
              className="h-4 w-4 rounded border-input"
              disabled={disabled}
              id="leads-require-email"
              onChange={(e) => onUpdateConfig("requireEmail", e.target.checked)}
              type="checkbox"
            />
            <Label
              className="font-normal text-sm"
              htmlFor="leads-require-email"
            >
              Require Email
            </Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Only show leads with email addresses
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              checked={(config.requirePhone as boolean) ?? false}
              className="h-4 w-4 rounded border-input"
              disabled={disabled}
              id="leads-require-phone"
              onChange={(e) => onUpdateConfig("requirePhone", e.target.checked)}
              type="checkbox"
            />
            <Label
              className="font-normal text-sm"
              htmlFor="leads-require-phone"
            >
              Require Phone
            </Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Only show leads with phone numbers
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              checked={(config.requireWebsite as boolean) ?? false}
              className="h-4 w-4 rounded border-input"
              disabled={disabled}
              id="leads-require-website"
              onChange={(e) =>
                onUpdateConfig("requireWebsite", e.target.checked)
              }
              type="checkbox"
            />
            <Label
              className="font-normal text-sm"
              htmlFor="leads-require-website"
            >
              Require Website
            </Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Only show leads with websites
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leads-page-size">Page Size</Label>
          <Input
            disabled={disabled}
            id="leads-page-size"
            max={100}
            min={1}
            onChange={(e) => onUpdateConfig("pageSize", e.target.value)}
            placeholder="20"
            type="number"
            value={(config.pageSize as string) || "20"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leads-page-number">Page Number</Label>
          <Input
            disabled={disabled}
            id="leads-page-number"
            min={1}
            onChange={(e) => onUpdateConfig("pageNumber", e.target.value)}
            placeholder="1"
            type="number"
            value={(config.pageNumber as string) || "1"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leads-sort-field">Sort By</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => onUpdateConfig("sortField", value)}
            value={(config.sortField as string) || ""}
          >
            <SelectTrigger className="w-full" id="leads-sort-field">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="google_rating">Google Rating</SelectItem>
              <SelectItem value="review_count">Review Count</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leads-sort-direction">Sort Direction</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => onUpdateConfig("sortDirection", value)}
            value={(config.sortDirection as string) || ""}
          >
            <SelectTrigger className="w-full" id="leads-sort-direction">
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

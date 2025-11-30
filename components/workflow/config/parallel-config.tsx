"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ParallelConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function ParallelConfig({
  config,
  onUpdateConfig,
  disabled,
}: ParallelConfigProps) {
  const parallelMode = (config.parallelMode as string) || "all";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parallel-mode">Execution Mode</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("parallelMode", value)}
          value={parallelMode}
        >
          <SelectTrigger className="w-full" id="parallel-mode">
            <SelectValue placeholder="Select execution mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All (wait for all branches)</SelectItem>
            <SelectItem value="race">Race (first to complete)</SelectItem>
            <SelectItem value="any">Any (first success)</SelectItem>
            <SelectItem value="allSettled">
              All Settled (wait regardless of errors)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          {parallelMode === "all" && "All branches must complete successfully"}
          {parallelMode === "race" &&
            "First branch to complete wins (success or error)"}
          {parallelMode === "any" &&
            "First successful branch wins, ignore errors"}
          {parallelMode === "allSettled" &&
            "Wait for all branches, collect all results"}
        </p>
      </div>

      {parallelMode === "all" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              checked={config.failFast as boolean}
              className="h-4 w-4 rounded border-input"
              disabled={disabled}
              id="parallel-fail-fast"
              onChange={(e) => onUpdateConfig("failFast", e.target.checked)}
              type="checkbox"
            />
            <Label className="font-normal text-sm" htmlFor="parallel-fail-fast">
              Fail fast
            </Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Stop remaining branches immediately when one fails
          </p>
        </div>
      )}

      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-muted-foreground text-xs">
          Connect multiple nodes from this parallel node to create branches.
          Each outgoing connection becomes a parallel branch.
        </p>
      </div>
    </div>
  );
}

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

type LoopConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function LoopConfig({
  config,
  onUpdateConfig,
  disabled,
}: LoopConfigProps) {
  const loopType = (config.loopType as string) || "times";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loop-type">Loop Type</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("loopType", value)}
          value={loopType}
        >
          <SelectTrigger className="w-full" id="loop-type">
            <SelectValue placeholder="Select loop type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="times">Fixed iterations</SelectItem>
            <SelectItem value="forEach">For each (array)</SelectItem>
            <SelectItem value="while">While (condition)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loopType === "times" && (
        <div className="space-y-2">
          <Label htmlFor="loop-times">Number of iterations</Label>
          <Input
            disabled={disabled}
            id="loop-times"
            max={100}
            min={1}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value, 10);
              onUpdateConfig(
                "times",
                Number.isNaN(value) ? 1 : Math.min(Math.max(value, 1), 100)
              );
            }}
            placeholder="1"
            type="number"
            value={(config.times as number) || 1}
          />
          <p className="text-muted-foreground text-xs">
            Maximum 100 iterations for safety
          </p>
        </div>
      )}

      {loopType === "forEach" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="loop-collection">Collection</Label>
            <TemplateBadgeInput
              disabled={disabled}
              id="loop-collection"
              onChange={(value) => onUpdateConfig("collection", value)}
              placeholder="{{previousNode.items}}"
              value={(config.collection as string) || ""}
            />
            <p className="text-muted-foreground text-xs">
              Reference to an array from a previous node
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loop-item-var">Item variable name</Label>
            <Input
              disabled={disabled}
              id="loop-item-var"
              onChange={(e) => onUpdateConfig("itemVariable", e.target.value)}
              placeholder="item"
              value={(config.itemVariable as string) || "item"}
            />
            <p className="text-muted-foreground text-xs">
              Access via {"{{loop.item}}"} in loop body
            </p>
          </div>
        </>
      )}

      {loopType === "while" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="loop-condition">Condition</Label>
            <TemplateBadgeInput
              disabled={disabled}
              id="loop-condition"
              onChange={(value) => onUpdateConfig("condition", value)}
              placeholder="{{loop.index}} < 10"
              value={(config.condition as string) || ""}
            />
            <p className="text-muted-foreground text-xs">
              Loop continues while this evaluates to true
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loop-max">Max iterations (safety limit)</Label>
            <Input
              disabled={disabled}
              id="loop-max"
              max={100}
              min={1}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                onUpdateConfig(
                  "maxIterations",
                  Number.isNaN(value) ? 100 : Math.min(Math.max(value, 1), 100)
                );
              }}
              placeholder="100"
              type="number"
              value={(config.maxIterations as number) || 100}
            />
          </div>
        </>
      )}
    </div>
  );
}

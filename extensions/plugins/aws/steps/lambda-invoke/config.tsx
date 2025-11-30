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
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";

type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function InvokeLambdaConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: ConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lambda-function">Function Name or ARN</Label>
        <Input
          disabled={disabled}
          id="lambda-function"
          onChange={(e) => onUpdateConfig("functionName", e.target.value)}
          placeholder="my-function or arn:aws:lambda:..."
          value={(config.functionName as string) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lambda-payload">Payload (JSON)</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="lambda-payload"
          onChange={(value) => onUpdateConfig("payload", value)}
          placeholder='{"key": "value"} or {{previousNode.output}}'
          rows={6}
          value={(config.payload as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          JSON payload to send to the Lambda function
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lambda-invocation-type">Invocation Type</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("invocationType", value)}
          value={(config.invocationType as string) || "RequestResponse"}
        >
          <SelectTrigger className="w-full" id="lambda-invocation-type">
            <SelectValue placeholder="Select invocation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RequestResponse">
              Synchronous (RequestResponse)
            </SelectItem>
            <SelectItem value="Event">Asynchronous (Event)</SelectItem>
            <SelectItem value="DryRun">Dry Run (validate only)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

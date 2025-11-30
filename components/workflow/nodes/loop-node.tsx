"use client";

import type { NodeProps } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { Check, EyeOff, Repeat, XCircle } from "lucide-react";
import { memo } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";
import {
  executionLogsAtom,
  selectedExecutionIdAtom,
} from "@/lib/workflow-store";

type LoopNodeProps = NodeProps & {
  data?: WorkflowNodeData;
  id: string;
};

const StatusBadge = ({
  status,
}: {
  status?: "idle" | "running" | "success" | "error";
}) => {
  if (!status || status === "idle" || status === "running") {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-2 right-2 rounded-full p-1",
        status === "success" && "bg-green-500/50",
        status === "error" && "bg-red-500/50"
      )}
    >
      {status === "success" && (
        <Check className="size-3.5 text-white" strokeWidth={2.5} />
      )}
      {status === "error" && (
        <XCircle className="size-3.5 text-white" strokeWidth={2.5} />
      )}
    </div>
  );
};

export const LoopNode = memo(({ data, selected, id }: LoopNodeProps) => {
  const selectedExecutionId = useAtomValue(selectedExecutionIdAtom);
  const executionLogs = useAtomValue(executionLogsAtom);

  if (!data) {
    return null;
  }

  const status = data.status;
  const isDisabled = data.enabled === false;
  const loopType = (data.config?.loopType as string) || "times";
  const times = (data.config?.times as number) || 1;
  const collection = data.config?.collection as string;
  const condition = data.config?.condition as string;

  // Get loop description based on type
  const getLoopDescription = () => {
    switch (loopType) {
      case "forEach":
        return collection ? `forEach: ${collection}` : "forEach: [array]";
      case "while":
        return condition
          ? `while: ${condition.slice(0, 20)}...`
          : "while: [condition]";
      default:
        return `${times} iteration${times !== 1 ? "s" : ""}`;
    }
  };

  // Check for execution stats
  const nodeLog = selectedExecutionId ? executionLogs[id] : undefined;
  const iterationsCompleted = nodeLog?.output
    ? (nodeLog.output as { iterationsCompleted?: number }).iterationsCompleted
    : undefined;

  return (
    <Node
      className={cn(
        "relative flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
        isDisabled && "opacity-50"
      )}
      handles={{ target: true, source: true }}
      status={status}
    >
      {isDisabled && (
        <div className="absolute top-2 left-2 rounded-full bg-gray-500/50 p-1">
          <EyeOff className="size-3.5 text-white" />
        </div>
      )}

      <StatusBadge status={status} />

      <div className="flex flex-col items-center justify-center gap-3 p-6">
        <Repeat className="size-12 text-purple-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-base">{data.label || "Loop"}</NodeTitle>
          <NodeDescription className="text-xs">
            {getLoopDescription()}
          </NodeDescription>
          {iterationsCompleted !== undefined && (
            <div className="rounded-full border border-muted-foreground/50 px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
              {iterationsCompleted} completed
            </div>
          )}
        </div>
      </div>
    </Node>
  );
});

LoopNode.displayName = "LoopNode";

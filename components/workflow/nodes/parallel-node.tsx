"use client";

import type { NodeProps } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { Check, EyeOff, GitFork, XCircle } from "lucide-react";
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

type ParallelNodeProps = NodeProps & {
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

const PARALLEL_MODE_LABELS: Record<string, string> = {
  all: "Wait for all",
  race: "First wins",
  any: "Any succeeds",
  allSettled: "All settled",
};

export const ParallelNode = memo(
  ({ data, selected, id }: ParallelNodeProps) => {
    const selectedExecutionId = useAtomValue(selectedExecutionIdAtom);
    const executionLogs = useAtomValue(executionLogsAtom);

    if (!data) {
      return null;
    }

    const status = data.status;
    const isDisabled = data.enabled === false;
    const parallelMode = (data.config?.parallelMode as string) || "all";
    const failFast = data.config?.failFast as boolean;

    // Get mode description
    const getModeDescription = () => {
      const modeLabel = PARALLEL_MODE_LABELS[parallelMode] || "Parallel";
      if (failFast && parallelMode === "all") {
        return `${modeLabel} (fail-fast)`;
      }
      return modeLabel;
    };

    // Check for execution stats
    const nodeLog = selectedExecutionId ? executionLogs[id] : undefined;
    const branchesCompleted = nodeLog?.output
      ? (nodeLog.output as { branchesCompleted?: number }).branchesCompleted
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
          <GitFork className="size-12 text-blue-400" strokeWidth={1.5} />
          <div className="flex flex-col items-center gap-1 text-center">
            <NodeTitle className="text-base">
              {data.label || "Parallel"}
            </NodeTitle>
            <NodeDescription className="text-xs">
              {getModeDescription()}
            </NodeDescription>
            {branchesCompleted !== undefined && (
              <div className="rounded-full border border-muted-foreground/50 px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
                {branchesCompleted} branches
              </div>
            )}
          </div>
        </div>
      </Node>
    );
  }
);

ParallelNode.displayName = "ParallelNode";

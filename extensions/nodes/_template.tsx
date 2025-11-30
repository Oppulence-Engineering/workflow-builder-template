"use client";

/**
 * Custom Node Template
 *
 * Copy this file to create a new custom node type.
 * 1. Copy to extensions/nodes/[node-name].tsx
 * 2. Update the component name and logic
 * 3. Register in extensions/nodes/index.ts
 * 4. Add to workflow-canvas.tsx nodeTypes
 */

import type { NodeProps } from "@xyflow/react";

// Choose an appropriate icon from lucide-react
import { Box } from "lucide-react";
import { memo } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";

type CustomNodeProps = NodeProps & {
  data?: WorkflowNodeData;
  id: string;
};

export const CustomNode = memo(({ data, selected }: CustomNodeProps) => {
  if (!data) {
    return null;
  }

  const status = data.status;
  const isDisabled = data.enabled === false;

  return (
    <Node
      className={cn(
        "flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
        isDisabled && "opacity-50"
      )}
      handles={{ target: true, source: true }}
      status={status}
    >
      <div className="flex flex-col items-center justify-center gap-3 p-6">
        <Box className="size-12 text-purple-300" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-base">
            {data.label || "Custom Node"}
          </NodeTitle>
          <NodeDescription className="text-xs">
            {data.description || "Custom node description"}
          </NodeDescription>
        </div>
      </div>
    </Node>
  );
});

CustomNode.displayName = "CustomNode";

/**
 * Custom Node Types Extension
 *
 * Register fork-specific workflow node types here.
 * These will be merged with the base node types in workflow-canvas.tsx
 */

import type { NodeProps } from "@xyflow/react";
import type { ComponentType } from "react";

// Import custom node components
// import { ParallelNode } from "./parallel-node";
// import { LoopNode } from "./loop-node";
// import { SubworkflowNode } from "./subworkflow-node";

/**
 * Extension node types to merge with base node types
 *
 * Usage in workflow-canvas.tsx:
 * ```
 * import { extensionNodeTypes } from "@/extensions";
 *
 * const nodeTypes = useMemo(() => ({
 *   trigger: TriggerNode,
 *   action: ActionNode,
 *   add: AddNode,
 *   ...extensionNodeTypes,  // Add extension nodes
 * }), []);
 * ```
 */
export const extensionNodeTypes: Record<string, ComponentType<NodeProps>> = {
  // Uncomment as you implement:
  // parallel: ParallelNode,
  // loop: LoopNode,
  // subworkflow: SubworkflowNode,
};

/**
 * Node type metadata for the UI (action grid, etc.)
 */
export const extensionNodeMetadata = {
  // parallel: {
  //   label: "Parallel",
  //   description: "Execute multiple branches in parallel",
  //   icon: "GitFork",
  //   category: "Flow Control",
  // },
};

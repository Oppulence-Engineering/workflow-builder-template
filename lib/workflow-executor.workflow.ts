/**
 * Workflow-based executor using "use workflow" and "use step" directives
 * This executor captures step executions through the workflow SDK for better observability
 */

import {
  preValidateConditionExpression,
  validateConditionExpression,
} from "@/lib/condition-validator";
import {
  getActionLabel,
  getStepImporter,
  type StepImporter,
} from "./step-registry";
import type { StepContext } from "./steps/step-handler";
import { triggerStep } from "./steps/trigger";
import { getErrorMessageAsync } from "./utils";
import type { WorkflowEdge, WorkflowNode } from "./workflow-store";

// Top-level regex pattern for template parsing (moved here for performance)
const TEMPLATE_PATTERN = /\{\{@([^:]+):([^}]+)\}\}/;

// System actions that don't have plugins - maps to module import functions
const SYSTEM_ACTIONS: Record<string, StepImporter> = {
  "Database Query": {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic module import
    importer: () => import("./steps/database-query") as Promise<any>,
    stepFunction: "databaseQueryStep",
  },
  "HTTP Request": {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic module import
    importer: () => import("./steps/http-request") as Promise<any>,
    stepFunction: "httpRequestStep",
  },
  Condition: {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic module import
    importer: () => import("./steps/condition") as Promise<any>,
    stepFunction: "conditionStep",
  },
};

type ExecutionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

type NodeOutputs = Record<string, { label: string; data: unknown }>;

export type WorkflowExecutionInput = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerInput?: Record<string, unknown>;
  executionId?: string;
  workflowId?: string; // Used by steps to fetch credentials
};

/**
 * Loop execution context for tracking iteration state
 */
type LoopContext = {
  index: number;
  iteration: number;
  item: unknown;
  items: unknown[];
};

/**
 * Loop execution input parameters
 */
type LoopExecutionInput = {
  config: Record<string, unknown>;
  nodeId: string;
  nodeLabel: string;
  bodyNodeIds: string[];
  outputs: NodeOutputs;
  results: Record<string, ExecutionResult>;
  visited: Set<string>;
  executeNode: (nodeId: string, visited: Set<string>) => Promise<void>;
  evaluateCondition: (expr: unknown, outputs: NodeOutputs) => boolean;
};

/**
 * Resolve a template variable reference to get collection data
 */
function resolveCollectionFromTemplate(
  collectionRef: string,
  outputs: NodeOutputs
): unknown[] {
  const match = collectionRef.match(TEMPLATE_PATTERN);

  if (!match) {
    return [];
  }

  const [, refNodeId, rest] = match;
  const sanitizedRefNodeId = refNodeId.replace(/[^a-zA-Z0-9]/g, "_");
  const output = outputs[sanitizedRefNodeId];

  if (!output?.data) {
    return [];
  }

  const dotIndex = rest.indexOf(".");
  if (dotIndex === -1) {
    return Array.isArray(output.data) ? output.data : [output.data];
  }

  const fieldPath = rest.substring(dotIndex + 1);
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic data traversal
  let current: any = output.data;

  for (const field of fieldPath.split(".")) {
    if (current && typeof current === "object") {
      current = current[field];
    } else {
      return [];
    }
  }

  return Array.isArray(current) ? current : [];
}

/**
 * Update loop context in outputs for template access
 */
function updateLoopOutputs(
  nodeId: string,
  nodeLabel: string,
  loopContext: LoopContext,
  outputs: NodeOutputs
): void {
  const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
  outputs[sanitizedNodeId] = {
    label: nodeLabel,
    data: { loop: loopContext },
  };
}

/**
 * Execute loop body nodes and collect results
 * IMPORTANT: Uses a shared visited set that accumulates across iterations
 * to properly detect cycles within loop bodies
 */
async function executeLoopBody(
  bodyNodeIds: string[],
  iterationVisited: Set<string>,
  results: Record<string, ExecutionResult>,
  executeNode: (nodeId: string, visited: Set<string>) => Promise<void>
): Promise<unknown[]> {
  const iterationResults: unknown[] = [];

  for (const bodyNodeId of bodyNodeIds) {
    // Create a new set for this specific body node execution to allow
    // re-execution of the same nodes in different iterations, but still
    // detect cycles within a single iteration
    const bodyVisited = new Set(iterationVisited);
    await executeNode(bodyNodeId, bodyVisited);
    if (results[bodyNodeId]) {
      iterationResults.push(results[bodyNodeId].data);
    }
  }

  return iterationResults;
}

/**
 * Execute a "times" loop (fixed iteration count)
 */
async function executeTimesLoop(
  times: number,
  loopContext: LoopContext,
  input: LoopExecutionInput
): Promise<{ iterationsCompleted: number; results: unknown[] }> {
  const iterationResults: unknown[] = [];
  let iterationsCompleted = 0;
  const safeTimes = Math.min(times, 100); // Safety limit

  for (let i = 0; i < safeTimes; i++) {
    loopContext.index = i;
    loopContext.iteration = i + 1;

    updateLoopOutputs(
      input.nodeId,
      input.nodeLabel,
      loopContext,
      input.outputs
    );

    const bodyResults = await executeLoopBody(
      input.bodyNodeIds,
      input.visited,
      input.results,
      input.executeNode
    );
    iterationResults.push(...bodyResults);
    iterationsCompleted += 1;
  }

  return { iterationsCompleted, results: iterationResults };
}

/**
 * Execute a "forEach" loop (iterate over collection)
 */
async function executeForEachLoop(
  collection: unknown[],
  loopContext: LoopContext,
  input: LoopExecutionInput
): Promise<{ iterationsCompleted: number; results: unknown[] }> {
  const iterationResults: unknown[] = [];
  let iterationsCompleted = 0;

  loopContext.items = collection;

  for (let i = 0; i < collection.length; i++) {
    loopContext.index = i;
    loopContext.iteration = i + 1;
    loopContext.item = collection[i];

    updateLoopOutputs(
      input.nodeId,
      input.nodeLabel,
      loopContext,
      input.outputs
    );

    const bodyResults = await executeLoopBody(
      input.bodyNodeIds,
      input.visited,
      input.results,
      input.executeNode
    );
    iterationResults.push(...bodyResults);
    iterationsCompleted += 1;
  }

  return { iterationsCompleted, results: iterationResults };
}

/**
 * Execute a "while" loop (condition-based)
 * IMPORTANT: Index increment is in finally block to prevent infinite loops on errors
 */
async function executeWhileLoop(
  conditionExpr: string,
  maxIterations: number,
  loopContext: LoopContext,
  input: LoopExecutionInput
): Promise<{ iterationsCompleted: number; results: unknown[] }> {
  const iterationResults: unknown[] = [];
  let iterationsCompleted = 0;
  const safeMaxIterations = Math.min(maxIterations, 100); // Safety limit

  while (loopContext.index < safeMaxIterations) {
    updateLoopOutputs(
      input.nodeId,
      input.nodeLabel,
      loopContext,
      input.outputs
    );

    // Evaluate condition with error handling
    let shouldContinue = false;
    try {
      shouldContinue = input.evaluateCondition(conditionExpr, input.outputs);
    } catch (error) {
      console.error("[While Loop] Condition evaluation failed:", error);
      // On condition evaluation error, stop the loop safely
      break;
    }

    if (!shouldContinue) {
      break;
    }

    try {
      const bodyResults = await executeLoopBody(
        input.bodyNodeIds,
        input.visited,
        input.results,
        input.executeNode
      );
      iterationResults.push(...bodyResults);
      iterationsCompleted += 1;
    } finally {
      // Always increment index to prevent infinite loops, even on errors
      loopContext.index += 1;
      loopContext.iteration += 1;
    }
  }

  return { iterationsCompleted, results: iterationResults };
}

/**
 * Main loop execution handler - delegates to specific loop type handlers
 */
async function executeLoopNode(
  input: LoopExecutionInput
): Promise<ExecutionResult> {
  const loopType = (input.config.loopType as string) || "times";
  console.log("[Workflow Executor] Executing loop node:", loopType);

  const loopContext: LoopContext = {
    index: 0,
    iteration: 1,
    item: undefined,
    items: [],
  };

  try {
    let loopResult: { iterationsCompleted: number; results: unknown[] };

    switch (loopType) {
      case "times": {
        const times = (input.config.times as number) || 1;
        loopResult = await executeTimesLoop(times, loopContext, input);
        break;
      }
      case "forEach": {
        const collectionRef = input.config.collection as string;
        const collection = collectionRef
          ? resolveCollectionFromTemplate(collectionRef, input.outputs)
          : [];
        loopResult = await executeForEachLoop(collection, loopContext, input);
        break;
      }
      case "while": {
        const conditionExpr = (input.config.condition as string) || "false";
        const maxIterations = (input.config.maxIterations as number) || 100;
        loopResult = await executeWhileLoop(
          conditionExpr,
          maxIterations,
          loopContext,
          input
        );
        break;
      }
      default:
        return {
          success: false,
          error: `Unknown loop type: ${loopType}`,
        };
    }

    return {
      success: true,
      data: {
        iterationsCompleted: loopResult.iterationsCompleted,
        results: loopResult.results,
      },
    };
  } catch (error) {
    const errorMessage = await getErrorMessageAsync(error);
    return {
      success: false,
      error: `Loop execution failed: ${errorMessage}`,
    };
  }
}

/**
 * Helper to replace template variables in conditions
 */
// biome-ignore lint/nursery/useMaxParams: Helper function needs all parameters for template replacement
function replaceTemplateVariable(
  match: string,
  nodeId: string,
  rest: string,
  outputs: NodeOutputs,
  evalContext: Record<string, unknown>,
  varCounter: { value: number }
): string {
  const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
  const output = outputs[sanitizedNodeId];

  if (!output) {
    console.log("[Condition] Output not found for node:", sanitizedNodeId);
    return match;
  }

  const dotIndex = rest.indexOf(".");
  let value: unknown;

  if (dotIndex === -1) {
    value = output.data;
  } else if (output.data === null || output.data === undefined) {
    value = undefined;
  } else {
    const fieldPath = rest.substring(dotIndex + 1);
    const fields = fieldPath.split(".");
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic data traversal
    let current: any = output.data;

    for (const field of fields) {
      if (current && typeof current === "object") {
        current = current[field];
      } else {
        console.log("[Condition] Field access failed:", fieldPath);
        value = undefined;
        break;
      }
    }
    if (value === undefined && current !== undefined) {
      value = current;
    }
  }

  const varName = `__v${varCounter.value}`;
  varCounter.value += 1;
  evalContext[varName] = value;
  return varName;
}

/**
 * Evaluate condition expression with template variable replacement
 * Uses Function constructor to evaluate user-defined conditions dynamically
 *
 * Security: Expressions are validated before evaluation to prevent code injection.
 * Only comparison operators, logical operators, and whitelisted methods are allowed.
 */
function evaluateConditionExpression(
  conditionExpression: unknown,
  outputs: NodeOutputs
): boolean {
  console.log("[Condition] Original expression:", conditionExpression);

  if (typeof conditionExpression === "boolean") {
    return conditionExpression;
  }

  if (typeof conditionExpression === "string") {
    // Pre-validate the expression before any processing
    const preValidation = preValidateConditionExpression(conditionExpression);
    if (!preValidation.valid) {
      console.error("[Condition] Pre-validation failed:", preValidation.error);
      console.error("[Condition] Expression was:", conditionExpression);
      return false;
    }

    try {
      const evalContext: Record<string, unknown> = {};
      let transformedExpression = conditionExpression;
      const templatePattern = /\{\{@([^:]+):([^}]+)\}\}/g;
      const varCounter = { value: 0 };

      transformedExpression = transformedExpression.replace(
        templatePattern,
        (match, nodeId, rest) =>
          replaceTemplateVariable(
            match,
            nodeId,
            rest,
            outputs,
            evalContext,
            varCounter
          )
      );

      // Validate the transformed expression before evaluation
      const validation = validateConditionExpression(transformedExpression);
      if (!validation.valid) {
        console.error("[Condition] Validation failed:", validation.error);
        console.error("[Condition] Original expression:", conditionExpression);
        console.error(
          "[Condition] Transformed expression:",
          transformedExpression
        );
        return false;
      }

      const varNames = Object.keys(evalContext);
      const varValues = Object.values(evalContext);

      // Safe to evaluate - expression has been validated
      // Only contains: variables (__v0, __v1), operators, literals, and whitelisted methods
      const evalFunc = new Function(
        ...varNames,
        `return (${transformedExpression});`
      );
      const result = evalFunc(...varValues);
      return Boolean(result);
    } catch (error) {
      console.error("[Condition] Failed to evaluate condition:", error);
      console.error("[Condition] Expression was:", conditionExpression);
      return false;
    }
  }

  return Boolean(conditionExpression);
}

/**
 * Execute a single action step with logging via stepHandler
 * IMPORTANT: Steps receive only the integration ID as a reference to fetch credentials.
 * This prevents credentials from being logged in Vercel's workflow observability.
 */
async function executeActionStep(input: {
  actionType: string;
  config: Record<string, unknown>;
  outputs: NodeOutputs;
  context: StepContext;
}) {
  const { actionType, config, outputs, context } = input;

  // Build step input WITHOUT credentials, but WITH integrationId reference and logging context
  const stepInput: Record<string, unknown> = {
    ...config,
    _context: context,
  };

  // Special handling for Condition action - needs template evaluation
  if (actionType === "Condition") {
    const systemAction = SYSTEM_ACTIONS.Condition;
    const module = await systemAction.importer();
    const evaluatedCondition = evaluateConditionExpression(
      stepInput.condition,
      outputs
    );
    console.log("[Condition] Final result:", evaluatedCondition);

    return await module[systemAction.stepFunction]({
      condition: evaluatedCondition,
      _context: context,
    });
  }

  // Check system actions first (Database Query, HTTP Request)
  const systemAction = SYSTEM_ACTIONS[actionType];
  if (systemAction) {
    const module = await systemAction.importer();
    const stepFunction = module[systemAction.stepFunction];
    return await stepFunction(stepInput);
  }

  // Look up plugin action from the generated step registry
  const stepImporter = getStepImporter(actionType);
  if (stepImporter) {
    const module = await stepImporter.importer();
    const stepFunction = module[stepImporter.stepFunction];
    if (stepFunction) {
      return await stepFunction(stepInput);
    }

    return {
      success: false,
      error: `Step function "${stepImporter.stepFunction}" not found in module for action "${actionType}". Check that the plugin exports the correct function name.`,
    };
  }

  // Fallback for unknown action types
  return {
    success: false,
    error: `Unknown action type: "${actionType}". This action is not registered in the plugin system. Available system actions: ${Object.keys(SYSTEM_ACTIONS).join(", ")}.`,
  };
}

/**
 * Process template variables in config
 */
function processTemplates(
  config: Record<string, unknown>,
  outputs: NodeOutputs
): Record<string, unknown> {
  const processed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      // Process template variables like {{@nodeId:Label.field}}
      let processedValue = value;
      const templatePattern = /\{\{@([^:]+):([^}]+)\}\}/g;
      processedValue = processedValue.replace(
        templatePattern,
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Template processing requires nested logic
        (match, nodeId, rest) => {
          const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
          const output = outputs[sanitizedNodeId];
          if (!output) {
            return match;
          }

          const dotIndex = rest.indexOf(".");
          if (dotIndex === -1) {
            // No field path, return the entire output data
            const data = output.data;
            if (data === null || data === undefined) {
              // Return empty string for null/undefined data (e.g., from disabled nodes)
              return "";
            }
            if (typeof data === "object") {
              return JSON.stringify(data);
            }
            return String(data);
          }

          // If data is null/undefined, return empty string instead of trying to access fields
          if (output.data === null || output.data === undefined) {
            return "";
          }

          const fieldPath = rest.substring(dotIndex + 1);
          const fields = fieldPath.split(".");
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic output data traversal
          let current: any = output.data;

          for (const field of fields) {
            if (current && typeof current === "object") {
              current = current[field];
            } else {
              // Field access failed, return empty string
              return "";
            }
          }

          // Convert value to string, using JSON.stringify for objects/arrays
          if (current === null || current === undefined) {
            return "";
          }
          if (typeof current === "object") {
            return JSON.stringify(current);
          }
          return String(current);
        }
      );

      processed[key] = processedValue;
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Main workflow executor function
 */
export async function executeWorkflow(input: WorkflowExecutionInput) {
  "use workflow";

  console.log("[Workflow Executor] Starting workflow execution");

  const { nodes, edges, triggerInput = {}, executionId, workflowId } = input;

  console.log("[Workflow Executor] Input:", {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    hasExecutionId: !!executionId,
    workflowId: workflowId || "none",
  });

  const outputs: NodeOutputs = {};
  const results: Record<string, ExecutionResult> = {};

  // Build node and edge maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgesBySource = new Map<string, string[]>();
  for (const edge of edges) {
    const targets = edgesBySource.get(edge.source) || [];
    targets.push(edge.target);
    edgesBySource.set(edge.source, targets);
  }

  // Find trigger nodes
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const triggerNodes = nodes.filter(
    (node) => node.data.type === "trigger" && !nodesWithIncoming.has(node.id)
  );

  console.log(
    "[Workflow Executor] Found",
    triggerNodes.length,
    "trigger nodes"
  );

  // Helper to get a meaningful node name
  function getNodeName(node: WorkflowNode): string {
    if (node.data.label) {
      return node.data.label;
    }
    if (node.data.type === "action") {
      const actionType = node.data.config?.actionType as string;
      if (actionType) {
        // Look up the human-readable label from the step registry
        const label = getActionLabel(actionType);
        if (label) {
          return label;
        }
      }
      return "Action";
    }
    if (node.data.type === "trigger") {
      return (node.data.config?.triggerType as string) || "Trigger";
    }
    return node.data.type;
  }

  // Helper to execute a single node
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Node execution requires type checking and error handling
  async function executeNode(nodeId: string, visited: Set<string> = new Set()) {
    console.log("[Workflow Executor] Executing node:", nodeId);

    if (visited.has(nodeId)) {
      console.log("[Workflow Executor] Node already visited, skipping");
      return; // Prevent cycles
    }
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) {
      console.log("[Workflow Executor] Node not found:", nodeId);
      return;
    }

    // Skip disabled nodes
    if (node.data.enabled === false) {
      console.log("[Workflow Executor] Skipping disabled node:", nodeId);

      // Store null output for disabled nodes so downstream templates don't fail
      const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
      outputs[sanitizedNodeId] = {
        label: node.data.label || nodeId,
        data: null,
      };

      const nextNodes = edgesBySource.get(nodeId) || [];
      await Promise.all(
        nextNodes.map((nextNodeId) => executeNode(nextNodeId, visited))
      );
      return;
    }

    try {
      let result: ExecutionResult;

      if (node.data.type === "trigger") {
        console.log("[Workflow Executor] Executing trigger node");

        const config = node.data.config || {};
        const triggerType = config.triggerType as string;
        let triggerData: Record<string, unknown> = {
          triggered: true,
          timestamp: Date.now(),
        };

        // Handle webhook mock request for test runs
        if (
          triggerType === "Webhook" &&
          config.webhookMockRequest &&
          (!triggerInput || Object.keys(triggerInput).length === 0)
        ) {
          try {
            const mockData = JSON.parse(config.webhookMockRequest as string);
            triggerData = { ...triggerData, ...mockData };
            console.log(
              "[Workflow Executor] Using webhook mock request data:",
              mockData
            );
          } catch (error) {
            console.error(
              "[Workflow Executor] Failed to parse webhook mock request:",
              error
            );
          }
        } else if (triggerInput && Object.keys(triggerInput).length > 0) {
          // Use provided trigger input
          triggerData = { ...triggerData, ...triggerInput };
        }

        // Build context for logging
        const triggerContext: StepContext = {
          executionId,
          nodeId: node.id,
          nodeName: getNodeName(node),
          nodeType: node.data.type,
        };

        // Execute trigger step (handles logging internally)
        const triggerResult = await triggerStep({
          triggerData,
          _context: triggerContext,
        });

        result = {
          success: triggerResult.success,
          data: triggerResult.data,
        };
      } else if (node.data.type === "loop") {
        // Execute loop node using refactored handler
        const bodyNodeIds = edgesBySource.get(nodeId) || [];
        result = await executeLoopNode({
          config: node.data.config || {},
          nodeId,
          nodeLabel: node.data.label || "Loop",
          bodyNodeIds,
          outputs,
          results,
          visited,
          executeNode,
          evaluateCondition: evaluateConditionExpression,
        });
      } else if (node.data.type === "parallel") {
        // Execute parallel node
        const config = node.data.config || {};
        const parallelMode = (config.parallelMode as string) || "all";
        const failFast = config.failFast as boolean;
        console.log(
          "[Workflow Executor] Executing parallel node:",
          parallelMode
        );

        // Get all branch nodes (outgoing edges)
        const branchNodeIds = edgesBySource.get(nodeId) || [];
        console.log(
          "[Workflow Executor] Parallel branches:",
          branchNodeIds.length
        );

        if (branchNodeIds.length === 0) {
          result = {
            success: true,
            data: { branchesCompleted: 0, results: [] },
          };
        } else {
          try {
            // Shared set to track nodes being executed across all branches
            // This prevents convergence nodes from being executed multiple times
            const executingNodes = new Set<string>();

            // Create a function to execute a branch and return its result
            const executeBranch = async (
              branchNodeId: string
            ): Promise<ExecutionResult> => {
              // Create branch-specific visited set but share the executing tracker
              const branchVisited = new Set(visited);

              // Modified executeNode that checks executingNodes before execution
              const executeBranchNode = async (
                nId: string,
                vis: Set<string>
              ) => {
                // If another branch is already executing this node, skip it
                if (executingNodes.has(nId)) {
                  return;
                }
                executingNodes.add(nId);
                await executeNode(nId, vis);
              };

              await executeBranchNode(branchNodeId, branchVisited);
              // Return result with fallback for skipped/not-found nodes
              return results[branchNodeId] ?? { success: true, data: null };
            };

            let branchResults: ExecutionResult[] = [];

            if (parallelMode === "all") {
              if (failFast) {
                // True fail-fast: reject immediately on first failure
                const branchPromises = branchNodeIds.map((id) =>
                  executeBranch(id)
                );

                // Wrap each promise to throw on failure for true fail-fast behavior
                const failFastPromises = branchPromises.map(async (p, idx) => {
                  const res = await p;
                  if (!res?.success) {
                    throw new Error(
                      res?.error || `Branch ${branchNodeIds[idx]} failed`
                    );
                  }
                  return res;
                });

                try {
                  branchResults = await Promise.all(failFastPromises);
                  result = {
                    success: true,
                    data: {
                      branchesCompleted: branchResults.length,
                      results: branchResults.map((r) => r?.data),
                    },
                  };
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : "A branch failed";
                  result = {
                    success: false,
                    error: errorMessage,
                    data: {
                      branchesCompleted: 0,
                      results: [],
                    },
                  };
                }
              } else {
                // Execute all and wait for all
                const promises = branchNodeIds.map(executeBranch);
                branchResults = await Promise.all(promises);
                const allSuccess = branchResults.every((r) => r?.success);
                result = {
                  success: allSuccess,
                  data: {
                    branchesCompleted: branchResults.length,
                    results: branchResults.map((r) => r?.data),
                  },
                  error: allSuccess ? undefined : "One or more branches failed",
                };
              }
            } else if (parallelMode === "race") {
              // First to complete wins (success or error)
              const promises = branchNodeIds.map(executeBranch);
              const firstResult = await Promise.race(promises);
              result = {
                success: firstResult?.success ?? false,
                data: {
                  branchesCompleted: 1,
                  winner: firstResult?.data,
                },
                error: firstResult?.error,
              };
            } else if (parallelMode === "any") {
              // First successful branch wins - use Promise.any pattern
              // This will return as soon as one succeeds, without waiting for others
              const promises = branchNodeIds.map(executeBranch);

              // Create a promise that resolves when any branch succeeds
              const anySuccess = new Promise<ExecutionResult>(
                (resolve, reject) => {
                  let completedCount = 0;
                  const errors: string[] = [];

                  for (const promise of promises) {
                    promise
                      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Promise race logic requires handling multiple outcomes
                      .then((res) => {
                        if (res?.success) {
                          resolve(res);
                        } else {
                          completedCount += 1;
                          errors.push(res?.error || "Unknown error");
                          if (completedCount === promises.length) {
                            reject(
                              new Error(
                                `All branches failed: ${errors.join(", ")}`
                              )
                            );
                          }
                        }
                      })
                      .catch((err) => {
                        completedCount += 1;
                        errors.push(String(err));
                        if (completedCount === promises.length) {
                          reject(
                            new Error(
                              `All branches failed: ${errors.join(", ")}`
                            )
                          );
                        }
                      });
                  }
                }
              );

              try {
                const firstSuccess = await anySuccess;
                result = {
                  success: true,
                  data: {
                    branchesCompleted: 1,
                    winner: firstSuccess.data,
                  },
                };
              } catch (error) {
                result = {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "All branches failed",
                  data: {
                    branchesCompleted: branchNodeIds.length,
                    results: [],
                  },
                };
              }
            } else if (parallelMode === "allSettled") {
              // Wait for all, collect all results regardless of success/error
              const promises = branchNodeIds.map((id) =>
                executeBranch(id).catch(
                  (error) =>
                    ({
                      success: false,
                      error: String(error),
                    }) as ExecutionResult
                )
              );
              branchResults = await Promise.all(promises);
              result = {
                success: true, // allSettled always "succeeds"
                data: {
                  branchesCompleted: branchResults.length,
                  results: branchResults.map((r) => ({
                    status: r?.success ? "fulfilled" : "rejected",
                    value: r?.data,
                    reason: r?.error,
                  })),
                },
              };
            } else {
              result = {
                success: false,
                error: `Unknown parallel mode: ${parallelMode}`,
              };
            }
          } catch (error) {
            const errorMessage = await getErrorMessageAsync(error);
            result = {
              success: false,
              error: `Parallel execution failed: ${errorMessage}`,
            };
          }
        }

        // Mark all branch nodes as visited to prevent re-execution
        // when the normal "execute next nodes" flow runs below
        for (const branchId of branchNodeIds) {
          visited.add(branchId);
        }

        // Note: We don't return early - the result is stored below and
        // the "execute next nodes" logic will skip branches (now in visited set)
        // but could execute any other connected nodes (future convergence support)
      } else if (node.data.type === "action") {
        const config = node.data.config || {};
        const actionType = config.actionType as string | undefined;

        console.log("[Workflow Executor] Executing action node:", actionType);

        // Check if action type is defined
        if (!actionType) {
          result = {
            success: false,
            error: `Action node "${node.data.label || node.id}" has no action type configured`,
          };
          results[nodeId] = result;
          return;
        }

        // Process templates in config, but keep condition unprocessed for special handling
        const configWithoutCondition = { ...config };
        const originalCondition = config.condition;
        configWithoutCondition.condition = undefined;

        const processedConfig = processTemplates(
          configWithoutCondition,
          outputs
        );

        // Add back the original condition (unprocessed)
        if (originalCondition !== undefined) {
          processedConfig.condition = originalCondition;
        }

        // Build step context for logging (stepHandler will handle the logging)
        const stepContext: StepContext = {
          executionId,
          nodeId: node.id,
          nodeName: getNodeName(node),
          nodeType: node.data.type,
        };

        // Execute the action step with stepHandler (logging is handled inside)
        // IMPORTANT: We pass integrationId via config, not actual credentials
        // Steps fetch credentials internally using fetchCredentials(integrationId)
        console.log("[Workflow Executor] Calling executeActionStep");
        const stepResult = await executeActionStep({
          actionType,
          config: processedConfig,
          outputs,
          context: stepContext,
        });

        console.log("[Workflow Executor] Step result received:", {
          hasResult: !!stepResult,
          resultType: typeof stepResult,
        });

        // Check if the step returned an error result
        const isErrorResult =
          stepResult &&
          typeof stepResult === "object" &&
          "success" in stepResult &&
          (stepResult as { success: boolean }).success === false;

        if (isErrorResult) {
          const errorResult = stepResult as { success: false; error?: string };
          result = {
            success: false,
            error:
              errorResult.error ||
              `Step "${actionType}" in node "${node.data.label || node.id}" failed without a specific error message.`,
          };
        } else {
          result = {
            success: true,
            data: stepResult,
          };
        }
      } else {
        console.log("[Workflow Executor] Unknown node type:", node.data.type);
        result = {
          success: false,
          error: `Unknown node type "${node.data.type}" in node "${node.data.label || node.id}". Expected "trigger" or "action".`,
        };
      }

      // Store results
      results[nodeId] = result;

      // Store outputs with sanitized nodeId for template variable lookup
      const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
      outputs[sanitizedNodeId] = {
        label: node.data.label || nodeId,
        data: result.data,
      };

      console.log("[Workflow Executor] Node execution completed:", {
        nodeId,
        success: result.success,
      });

      // Execute next nodes
      if (result.success) {
        // Check if this is a condition node
        const isConditionNode =
          node.data.type === "action" &&
          node.data.config?.actionType === "Condition";

        if (isConditionNode) {
          // For condition nodes, only execute next nodes if condition is true
          const conditionResult = (result.data as { condition?: boolean })
            ?.condition;
          console.log(
            "[Workflow Executor] Condition node result:",
            conditionResult
          );

          if (conditionResult === true) {
            const nextNodes = edgesBySource.get(nodeId) || [];
            console.log(
              "[Workflow Executor] Condition is true, executing",
              nextNodes.length,
              "next nodes in parallel"
            );
            // Execute all next nodes in parallel
            await Promise.all(
              nextNodes.map((nextNodeId) => executeNode(nextNodeId, visited))
            );
          } else {
            console.log(
              "[Workflow Executor] Condition is false, skipping next nodes"
            );
          }
        } else {
          // For non-condition nodes, execute all next nodes in parallel
          const nextNodes = edgesBySource.get(nodeId) || [];
          console.log(
            "[Workflow Executor] Executing",
            nextNodes.length,
            "next nodes in parallel"
          );
          // Execute all next nodes in parallel
          await Promise.all(
            nextNodes.map((nextNodeId) => executeNode(nextNodeId, visited))
          );
        }
      }
    } catch (error) {
      console.error("[Workflow Executor] Error executing node:", nodeId, error);
      const errorMessage = await getErrorMessageAsync(error);
      const errorResult = {
        success: false,
        error: errorMessage,
      };
      results[nodeId] = errorResult;
      // Note: stepHandler already logged the error for action steps
      // Trigger steps don't throw, so this catch is mainly for unexpected errors
    }
  }

  // Execute from each trigger node in parallel
  try {
    console.log("[Workflow Executor] Starting execution from trigger nodes");
    const workflowStartTime = Date.now();

    await Promise.all(triggerNodes.map((trigger) => executeNode(trigger.id)));

    const finalSuccess = Object.values(results).every((r) => r.success);
    const duration = Date.now() - workflowStartTime;

    console.log("[Workflow Executor] Workflow execution completed:", {
      success: finalSuccess,
      resultCount: Object.keys(results).length,
      duration,
    });

    // Update execution record if we have an executionId
    if (executionId) {
      try {
        await triggerStep({
          triggerData: {},
          _workflowComplete: {
            executionId,
            status: finalSuccess ? "success" : "error",
            output: Object.values(results).at(-1)?.data,
            error: Object.values(results).find((r) => !r.success)?.error,
            startTime: workflowStartTime,
          },
        });
        console.log("[Workflow Executor] Updated execution record");
      } catch (error) {
        console.error(
          "[Workflow Executor] Failed to update execution record:",
          error
        );
      }
    }

    return {
      success: finalSuccess,
      results,
      outputs,
    };
  } catch (error) {
    console.error(
      "[Workflow Executor] Fatal error during workflow execution:",
      error
    );

    const errorMessage = await getErrorMessageAsync(error);

    // Update execution record with error if we have an executionId
    if (executionId) {
      try {
        await triggerStep({
          triggerData: {},
          _workflowComplete: {
            executionId,
            status: "error",
            error: errorMessage,
            startTime: Date.now(),
          },
        });
      } catch (logError) {
        console.error("[Workflow Executor] Failed to log error:", logError);
      }
    }

    return {
      success: false,
      results,
      outputs,
      error: errorMessage,
    };
  }
}

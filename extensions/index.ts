/**
 * Fork-Specific Extensions
 *
 * This file exports all fork-specific components, plugins, and utilities.
 * Import this file once in the main codebase to enable all extensions.
 *
 * This is the ONLY file that needs to be imported from the main codebase,
 * minimizing merge conflicts with upstream.
 */

// Register fork-specific plugins
import "./plugins";

// Export admin components
export { ADMIN_VERSION } from "./components/admin";
// Export custom hooks
export { HOOKS_VERSION } from "./hooks";
// Export custom node types for workflow canvas
export { extensionNodeMetadata, extensionNodeTypes } from "./nodes";

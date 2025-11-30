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

// biome-ignore lint/performance/noBarrelFile: This is the main entry point for extensions - barrel file is intentional
export { ADMIN_VERSION } from "./components/admin";
export { HOOKS_VERSION } from "./hooks";
export { extensionNodeMetadata, extensionNodeTypes } from "./nodes";

/**
 * Extension Registry
 *
 * This module provides a clean separation between upstream plugins and
 * fork-specific extension plugins. It wraps the upstream registry and
 * adds support for extension-specific features without modifying upstream files.
 *
 * IMPORTANT: This file should NOT be modified by upstream merges.
 */

import type { IntegrationType as UpstreamIntegrationType } from "@/lib/types/integration";
import type {
  ActionConfigField,
  IntegrationPlugin as UpstreamIntegrationPlugin,
  PluginAction as UpstreamPluginAction,
} from "@/plugins/registry";
import { registerIntegration as upstreamRegister } from "@/plugins/registry";

// ============================================================================
// Extension Types
// ============================================================================

/**
 * Extension integration types - add your custom integration types here
 * These are kept separate from upstream IntegrationType to avoid merge conflicts
 */
export type ExtensionIntegrationType =
  | "aws"
  | "azure"
  | "gcp"
  | "lead-scraper"
  | "mongodb"
  | "redis";

/**
 * Combined integration type - upstream + extensions
 */
export type AllIntegrationType =
  | UpstreamIntegrationType
  | ExtensionIntegrationType;

/**
 * Config props for component-based config fields (extension plugins)
 */
export type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

/**
 * Extension config fields - can be declarative array or React component
 */
export type ExtensionConfigFields =
  | ActionConfigField[]
  | React.ComponentType<ConfigProps>;

/**
 * Extension Plugin Action
 * Extends upstream PluginAction with extension-specific features
 */
export type ExtensionPluginAction = Omit<
  UpstreamPluginAction,
  "slug" | "configFields"
> & {
  // Use id instead of slug for extension plugins
  id?: string;
  slug?: string;
  // Support both declarative and component-based config
  configFields: ExtensionConfigFields;
  // Optional per-action icon
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * Extension Integration Plugin
 * Extends upstream IntegrationPlugin with extension-specific features
 */
export type ExtensionIntegrationPlugin = Omit<
  UpstreamIntegrationPlugin,
  "type" | "actions" | "settingsComponent" | "credentialMapping"
> & {
  // Allow extension types
  type: AllIntegrationType;
  // Use extension actions
  actions: ExtensionPluginAction[];
  // Optional settings component - flexible type for extension compatibility
  // biome-ignore lint/suspicious/noExplicitAny: Flexible settings component props
  settingsComponent?: React.ComponentType<any>;
  // Optional credential mapping function
  // biome-ignore lint/suspicious/noExplicitAny: Flexible config type for extensions
  credentialMapping?: (config: any) => Record<string, string>;
};

// ============================================================================
// Extension Registry
// ============================================================================

/**
 * Register an extension plugin
 * This casts the extension plugin to upstream types for compatibility
 */
export function registerExtensionPlugin(
  plugin: ExtensionIntegrationPlugin
): void {
  // Cast to upstream type - the runtime behavior is the same,
  // we just have more flexible types for extensions
  // biome-ignore lint/suspicious/noExplicitAny: Type bridge between extension and upstream
  upstreamRegister(plugin as any);
}

/**
 * Get the action slug from an extension action (supports both slug and id)
 */
export function getExtensionActionSlug(action: ExtensionPluginAction): string {
  return action.slug || action.id || action.label;
}

/**
 * Check if config fields are component-based (not declarative)
 */
export function isComponentConfigFields(
  configFields: ExtensionConfigFields
): configFields is React.ComponentType<ConfigProps> {
  return !Array.isArray(configFields);
}

// Note: Extensions should import upstream utilities directly from @/plugins/registry
// e.g., import { findActionById } from "@/plugins/registry";

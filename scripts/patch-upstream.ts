#!/usr/bin/env tsx

/**
 * Patch Upstream Script
 *
 * Run this script after merging upstream changes to restore extension compatibility.
 * It patches the upstream files with extension-specific modifications without
 * breaking upstream functionality.
 *
 * Usage:
 *   pnpm patch-upstream
 *
 * What it does:
 *   1. Adds extension types to SYSTEM_INTEGRATION_TYPES in discover-plugins.ts
 *   2. Adds extension-compatible types to plugins/registry.ts
 *   3. Patches integration-form-dialog.tsx to support settingsComponent (for wizard-based setup)
 *   4. Regenerates plugin files with pnpm discover-plugins
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const DISCOVER_PLUGINS_PATH = join(ROOT_DIR, "scripts", "discover-plugins.ts");
const REGISTRY_PATH = join(ROOT_DIR, "plugins", "registry.ts");
const INTEGRATION_FORM_DIALOG_PATH = join(
  ROOT_DIR,
  "components",
  "settings",
  "integration-form-dialog.tsx"
);

// Extension integration types to add
const EXTENSION_TYPES = [
  "aws",
  "azure",
  "gcp",
  "lead-scraper",
  "mongodb",
  "redis",
];

// Top-level regex patterns (required by linter for performance)
const SYSTEM_TYPES_REGEX =
  /const SYSTEM_INTEGRATION_TYPES = \[([^\]]*)\] as const;/;
const SYSTEM_TYPES_WITH_COMMENT_REGEX =
  /\/\/ System integrations[^\n]*\nconst SYSTEM_INTEGRATION_TYPES = \[[^\]]*\] as const;/;
const EXPORT_COMPUTE_ACTION_REGEX = /export \{\n {2}computeActionId,/;
const CONFIG_FIELD_TYPE_REGEX =
  /export type ActionConfigField = ActionConfigFieldBase \| ActionConfigFieldGroup;/;
const SLUG_PROP_REGEX = /\/\/ Unique slug for this action[^}]+slug: string;/;
const CATEGORY_PROP_REGEX = /category: string;(\s+\/\/ Step configuration)/;
const DEPENDENCIES_PROP_REGEX =
  /dependencies\?: Record<string, string>;(\s+\/\/ Actions provided)/;
const INTEGRATION_REGISTRY_REGEX = /const integrationRegistry = new Map/;
const FLATTEN_CONFIG_FIELDS_REGEX =
  /const flatFields = flattenConfigFields\(action\.configFields\);(\s+for \(const field of flatFields\))/;
const PRETTIER_CLEANUP_REGEX =
  /\/\/ @ts-expect-error[^\n]*\n\s*const prettier = await import\("prettier"\);/;

// Integration form dialog patching patterns
const _RENDER_CONFIG_FIELDS_REGEX = /const renderConfigFields = \(\) => \{/;
const PLUGIN_FORM_FIELDS_CHECK_REGEX =
  /if \(!plugin\?\.formFields\) \{\s*return null;\s*\}/;

/**
 * Patch discover-plugins.ts to include extension types
 */
function patchDiscoverPlugins(): boolean {
  console.log("Patching scripts/discover-plugins.ts...");

  let content = readFileSync(DISCOVER_PLUGINS_PATH, "utf-8");

  // Check if already patched
  if (content.includes('"aws"') && content.includes("Extension plugins")) {
    console.log("  ✓ Already patched");
    return false;
  }

  // Find SYSTEM_INTEGRATION_TYPES and add extension types
  const match = content.match(SYSTEM_TYPES_REGEX);

  if (!match) {
    console.error("  ✗ Could not find SYSTEM_INTEGRATION_TYPES");
    return false;
  }

  const existingTypes = match[1]
    .split(",")
    .map((t) => t.trim().replace(/['"]/g, ""))
    .filter(Boolean);

  // Add extension types that aren't already present
  const allTypes = [...new Set([...existingTypes, ...EXTENSION_TYPES])];
  const typesString = allTypes.map((t) => `"${t}"`).join(",\n  ");

  const newDeclaration = `// System integrations that don't have plugins
// Extension plugins are also listed here so they're included in the IntegrationType union
const SYSTEM_INTEGRATION_TYPES = [
  ${typesString},
] as const;`;

  // Replace the old declaration
  content = content.replace(SYSTEM_TYPES_WITH_COMMENT_REGEX, newDeclaration);

  // If the comment wasn't there, just replace the const
  if (!content.includes("Extension plugins")) {
    content = content.replace(SYSTEM_TYPES_REGEX, newDeclaration);
  }

  // Add getActionSlug to exports if not present
  if (!content.includes("getActionSlug,")) {
    content = content.replace(
      EXPORT_COMPUTE_ACTION_REGEX,
      "export {\n  computeActionId,\n  getActionSlug,"
    );
  }

  writeFileSync(DISCOVER_PLUGINS_PATH, content);
  console.log("  ✓ Patched successfully");
  return true;
}

/**
 * Patch plugins/registry.ts with extension-compatible types
 */
function patchRegistry(): boolean {
  console.log("Patching plugins/registry.ts...");

  let content = readFileSync(REGISTRY_PATH, "utf-8");

  // Check if already patched
  if (content.includes("getActionSlug") && content.includes("ConfigProps")) {
    console.log("  ✓ Already patched");
    return false;
  }

  let patched = false;

  // 1. Add ConfigProps type after ActionConfigField
  if (
    !content.includes("ConfigProps") &&
    content.match(CONFIG_FIELD_TYPE_REGEX)
  ) {
    content = content.replace(
      CONFIG_FIELD_TYPE_REGEX,
      `export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;

/**
 * Config Props for component-based config fields
 * Used by extension plugins that provide a React component instead of declarative fields
 */
export type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

/**
 * Action Config Fields
 * Can be either a declarative array of fields OR a React component (for extension plugins)
 */
export type ActionConfigFields =
  | ActionConfigField[]
  | React.ComponentType<ConfigProps>;`
    );
    patched = true;
  }

  // 2. Update PluginAction to support both slug and id
  if (
    !(content.includes("id?: string;") && content.includes("slug?: string;"))
  ) {
    // Make slug optional and add id
    content = content.replace(
      SLUG_PROP_REGEX,
      `// Unique slug for this action (e.g., "send-email")
  // Full action ID will be computed as \`{integration}/{slug}\` (e.g., "resend/send-email")
  // For extension plugins, \`id\` can be used instead
  slug?: string;

  // Alternative to slug - for extension plugins that use id directly
  id?: string;`
    );
    patched = true;
  }

  // 3. Add icon to PluginAction
  if (!content.includes("icon?: React.ComponentType")) {
    content = content.replace(
      CATEGORY_PROP_REGEX,
      `category: string;

  // Optional per-action icon (for extension plugins)
  icon?: React.ComponentType<{ className?: string }>;

  $1`
    );
    patched = true;
  }

  // 4. Update configFields type in PluginAction
  if (content.includes("configFields: ActionConfigField[];")) {
    content = content.replace(
      "configFields: ActionConfigField[];",
      "configFields: ActionConfigFields;"
    );
    patched = true;
  }

  // 5. Add settingsComponent and credentialMapping to IntegrationPlugin
  if (!content.includes("settingsComponent?:")) {
    content = content.replace(
      DEPENDENCIES_PROP_REGEX,
      `dependencies?: Record<string, string>;

  // Optional settings component for extension plugins
  // biome-ignore lint/suspicious/noExplicitAny: Flexible settings component props for extensions
  settingsComponent?: React.ComponentType<any>;

  // Optional credential mapping function for extension plugins
  // Maps plugin config to credential environment variables
  credentialMapping?: (
    config: Record<string, unknown>
  ) => Record<string, string>;

  $1`
    );
    patched = true;
  }

  // 6. Add getActionSlug helper function
  if (!content.includes("getActionSlug")) {
    content = content.replace(
      INTEGRATION_REGISTRY_REGEX,
      `/**
 * Get action slug from a PluginAction (supports both slug and id)
 */
export function getActionSlug(action: PluginAction): string {
  return action.slug || action.id || action.label;
}

const integrationRegistry = new Map`
    );

    // Update all action.slug usages to use getActionSlug
    content = content.replace(
      /computeActionId\(plugin\.type, action\.slug\)/g,
      "computeActionId(plugin.type, getActionSlug(action))"
    );

    patched = true;
  }

  // 7. Add array check before flattenConfigFields in generateAIActionPrompts
  if (
    !content.includes("if (!Array.isArray(action.configFields))") &&
    content.includes("generateAIActionPrompts")
  ) {
    content = content.replace(
      FLATTEN_CONFIG_FIELDS_REGEX,
      `// Skip component-based configFields for AI prompt generation
      if (!Array.isArray(action.configFields)) {
        lines.push(\`- \${action.label} (\${fullId}): \${JSON.stringify(exampleConfig)}\`);
        continue;
      }

      const flatFields = flattenConfigFields(action.configFields);$1`
    );
    patched = true;
  }

  if (patched) {
    writeFileSync(REGISTRY_PATH, content);
    console.log("  ✓ Patched successfully");
  } else {
    console.log("  ✓ Already patched");
  }

  return patched;
}

/**
 * Patch integration-form-dialog.tsx to support settingsComponent
 */
function patchIntegrationFormDialog(): boolean {
  console.log("Patching components/settings/integration-form-dialog.tsx...");

  let content = readFileSync(INTEGRATION_FORM_DIALOG_PATH, "utf-8");

  // Check if already patched
  if (content.includes("settingsComponent")) {
    console.log("  ✓ Already patched");
    return false;
  }

  let patched = false;

  // Add settingsComponent check before formFields rendering
  if (content.match(PLUGIN_FORM_FIELDS_CHECK_REGEX)) {
    content = content.replace(
      PLUGIN_FORM_FIELDS_CHECK_REGEX,
      `// Support custom settings component (for extension plugins with wizards)
    if (plugin?.settingsComponent) {
      const SettingsComponent = plugin.settingsComponent;
      return (
        <SettingsComponent
          config={formData.config}
          disabled={saving}
          onConfigChange={updateConfig}
        />
      );
    }

    if (!plugin?.formFields) {
      return null;
    }`
    );
    patched = true;
  }

  if (patched) {
    writeFileSync(INTEGRATION_FORM_DIALOG_PATH, content);
    console.log("  ✓ Patched successfully");
  } else {
    console.log("  ✗ Could not find insertion point for settingsComponent");
  }

  return patched;
}

/**
 * Remove @ts-expect-error for prettier import if prettier is installed
 * (prettier is now a dev dependency with types)
 */
function cleanupPrettierImport(): boolean {
  console.log("Checking prettier import...");

  let content = readFileSync(DISCOVER_PLUGINS_PATH, "utf-8");

  // If there's a stale @ts-expect-error, remove it
  if (content.includes("@ts-expect-error") && content.includes("prettier")) {
    content = content.replace(
      PRETTIER_CLEANUP_REGEX,
      'const prettier = await import("prettier");'
    );
    writeFileSync(DISCOVER_PLUGINS_PATH, content);
    console.log("  ✓ Cleaned up stale @ts-expect-error");
    return true;
  }

  console.log("  ✓ No cleanup needed");
  return false;
}

/**
 * Run discover-plugins to regenerate files
 */
function runDiscoverPlugins(): void {
  console.log("\nRunning pnpm discover-plugins...");
  try {
    execSync("pnpm discover-plugins", { stdio: "inherit", cwd: ROOT_DIR });
  } catch {
    console.error("  ✗ Failed to run discover-plugins");
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           Patching Upstream for Extensions                 ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  let needsRegeneration = false;

  needsRegeneration = patchDiscoverPlugins() || needsRegeneration;
  needsRegeneration = patchRegistry() || needsRegeneration;
  patchIntegrationFormDialog();
  cleanupPrettierImport();

  if (needsRegeneration) {
    runDiscoverPlugins();
  }

  console.log("\n✅ Upstream patching complete!");
  console.log("\nNext steps:");
  console.log("  1. Run: pnpm type-check");
  console.log("  2. Run: pnpm build");
  console.log("  3. Commit the changes");
}

main();

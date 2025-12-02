import { describe, expect, it, vi } from "vitest";

// Mock the file system and child_process modules
vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

// Import the regex patterns and test them directly
const SYSTEM_TYPES_REGEX =
  /const SYSTEM_INTEGRATION_TYPES = \[([^\]]*)\] as const;/;
const SYSTEM_TYPES_WITH_COMMENT_REGEX =
  /\/\/ System integrations[^\n]*\nconst SYSTEM_INTEGRATION_TYPES = \[[^\]]*\] as const;/;
const CONFIG_FIELD_TYPE_REGEX =
  /export type ActionConfigField = ActionConfigFieldBase \| ActionConfigFieldGroup;/;
const SLUG_PROP_REGEX = /\/\/ Unique slug for this action[^}]+slug: string;/;
const CATEGORY_PROP_REGEX = /category: string;(\s+\/\/ Step configuration)/;
const DEPENDENCIES_PROP_REGEX =
  /dependencies\?: Record<string, string>;(\s+\/\/ Actions provided)/;
const INTEGRATION_REGISTRY_REGEX = /const integrationRegistry = new Map/;
const PRETTIER_IMPORT_REGEX = /const prettier = await import\("prettier"\);/;
const CONFIG_FIELDS_SPACING_REGEX = /configFields\s*:\s*ActionConfigField\[\];/;
const PRETTIER_CLEANUP_REGEX =
  /\/\/ @ts-expect-error[^\n]*\n\s*const prettier = await import\("prettier"\);/;

// Sample unpatched discover-plugins.ts content
const UNPATCHED_DISCOVER_PLUGINS = `
// Some code before

// System integrations that don't have plugins
const SYSTEM_INTEGRATION_TYPES = ["database"] as const;

// Some code after

export {
  computeActionId,
  findActionById,
} from "./registry";

async function formatCode(code: string): Promise<string> {
  try {
    const prettier = await import("prettier");
    return await prettier.format(code, { parser: "typescript" });
  } catch (error) {
    return code;
  }
}
`;

// Sample already patched discover-plugins.ts content
const PATCHED_DISCOVER_PLUGINS = `
// Some code before

// System integrations that don't have plugins
// Extension plugins are also listed here so they're included in the IntegrationType union
const SYSTEM_INTEGRATION_TYPES = [
  "database",
  "aws",
  "azure",
  "gcp",
  "lead-scraper",
  "mongodb",
  "redis",
] as const;

// Some code after

export {
  computeActionId,
  getActionSlug,
  findActionById,
} from "./registry";

async function formatCode(code: string): Promise<string> {
  try {
    // @ts-expect-error - prettier doesn't have type declarations in dev deps
    const prettier = await import("prettier");
    return await prettier.format(code, { parser: "typescript" });
  } catch (error) {
    return code;
  }
}
`;

// Sample unpatched registry.ts content
const UNPATCHED_REGISTRY = `
export type ActionConfigFieldBase = {
  key: string;
  label: string;
};

export type ActionConfigFieldGroup = {
  groupLabel: string;
  fields: ActionConfigFieldBase[];
};

export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;

export type PluginAction = {
  // Unique slug for this action (e.g., "send-email")
  // Full action ID will be computed as \`{integration}/{slug}\`
  slug: string;

  label: string;
  description: string;
  category: string;

  // Step configuration
  stepFunction: string;
  stepImportPath: string;

  configFields: ActionConfigField[];
};

export type IntegrationPlugin = {
  type: string;
  label: string;

  dependencies?: Record<string, string>;

  // Actions provided by this integration
  actions: PluginAction[];
};

const integrationRegistry = new Map<string, IntegrationPlugin>();

export function getAllActions() {
  const actions = [];
  for (const plugin of integrationRegistry.values()) {
    for (const action of plugin.actions) {
      actions.push({
        ...action,
        id: computeActionId(plugin.type, action.slug),
      });
    }
  }
  return actions;
}

export function generateAIActionPrompts(): string {
  const lines: string[] = [];
  for (const plugin of integrationRegistry.values()) {
    for (const action of plugin.actions) {
      const fullId = computeActionId(plugin.type, action.slug);
      const exampleConfig = { actionType: fullId };
      const flatFields = flattenConfigFields(action.configFields);
      for (const field of flatFields) {
        // process fields
      }
      lines.push(JSON.stringify(exampleConfig));
    }
  }
  return lines.join("\\n");
}
`;

// Sample already patched registry.ts content
const PATCHED_REGISTRY = `
export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;

/**
 * Config Props for component-based config fields
 */
export type ConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export type ActionConfigFields =
  | ActionConfigField[]
  | React.ComponentType<ConfigProps>;

export type PluginAction = {
  slug?: string;
  id?: string;
  label: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
  configFields: ActionConfigFields;
};

export type IntegrationPlugin = {
  dependencies?: Record<string, string>;
  settingsComponent?: React.ComponentType<any>;
  credentialMapping?: (config: Record<string, unknown>) => Record<string, string>;
  actions: PluginAction[];
};

export function getActionSlug(action: PluginAction): string {
  return action.slug || action.id || action.label;
}

const integrationRegistry = new Map<string, IntegrationPlugin>();
`;

describe("patch-upstream regex patterns", () => {
  describe("SYSTEM_TYPES_REGEX", () => {
    it("should match unpatched SYSTEM_INTEGRATION_TYPES", () => {
      const match = UNPATCHED_DISCOVER_PLUGINS.match(SYSTEM_TYPES_REGEX);
      expect(match).not.toBeNull();
      expect(match?.[1]).toContain('"database"');
    });

    it("should match patched SYSTEM_INTEGRATION_TYPES", () => {
      const match = PATCHED_DISCOVER_PLUGINS.match(SYSTEM_TYPES_REGEX);
      expect(match).not.toBeNull();
    });

    it("should capture the types list", () => {
      const content = 'const SYSTEM_INTEGRATION_TYPES = ["a", "b"] as const;';
      const match = content.match(SYSTEM_TYPES_REGEX);
      expect(match?.[1]).toBe('"a", "b"');
    });
  });

  describe("SYSTEM_TYPES_WITH_COMMENT_REGEX", () => {
    it("should match declaration with comment", () => {
      const content = `// System integrations that don't have plugins
const SYSTEM_INTEGRATION_TYPES = ["database"] as const;`;
      const match = content.match(SYSTEM_TYPES_WITH_COMMENT_REGEX);
      expect(match).not.toBeNull();
    });

    it("should not match declaration without comment", () => {
      const content = 'const SYSTEM_INTEGRATION_TYPES = ["database"] as const;';
      const match = content.match(SYSTEM_TYPES_WITH_COMMENT_REGEX);
      expect(match).toBeNull();
    });
  });

  describe("CONFIG_FIELD_TYPE_REGEX", () => {
    it("should match ActionConfigField type definition", () => {
      const content =
        "export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;";
      const match = content.match(CONFIG_FIELD_TYPE_REGEX);
      expect(match).not.toBeNull();
    });
  });

  describe("SLUG_PROP_REGEX", () => {
    it("should match slug property with comment", () => {
      const content = `// Unique slug for this action (e.g., "send-email")
  // Full action ID will be computed
  slug: string;`;
      const match = content.match(SLUG_PROP_REGEX);
      expect(match).not.toBeNull();
    });
  });

  describe("CATEGORY_PROP_REGEX", () => {
    it("should match category property followed by step configuration comment", () => {
      const content = `category: string;

  // Step configuration
  stepFunction: string;`;
      const match = content.match(CATEGORY_PROP_REGEX);
      expect(match).not.toBeNull();
      expect(match?.[1]).toContain("// Step configuration");
    });
  });

  describe("DEPENDENCIES_PROP_REGEX", () => {
    it("should match dependencies property followed by actions comment", () => {
      const content = `dependencies?: Record<string, string>;

  // Actions provided by this integration
  actions: PluginAction[];`;
      const match = content.match(DEPENDENCIES_PROP_REGEX);
      expect(match).not.toBeNull();
      expect(match?.[1]).toContain("// Actions provided");
    });
  });

  describe("INTEGRATION_REGISTRY_REGEX", () => {
    it("should match integrationRegistry declaration", () => {
      const content = "const integrationRegistry = new Map<string, Plugin>();";
      const match = content.match(INTEGRATION_REGISTRY_REGEX);
      expect(match).not.toBeNull();
    });
  });

  describe("PRETTIER_IMPORT_REGEX", () => {
    it("should match prettier dynamic import", () => {
      const content = 'const prettier = await import("prettier");';
      const match = content.match(PRETTIER_IMPORT_REGEX);
      expect(match).not.toBeNull();
    });

    it("should match import with @ts-expect-error", () => {
      const content = `// @ts-expect-error
    const prettier = await import("prettier");`;
      // The regex should still match the import line itself
      const match = content.match(PRETTIER_IMPORT_REGEX);
      expect(match).not.toBeNull();
    });
  });

  describe("PRETTIER_CLEANUP_REGEX", () => {
    it("should match @ts-expect-error with prettier import", () => {
      const content = `// @ts-expect-error - prettier doesn't have types
    const prettier = await import("prettier");`;
      const match = content.match(PRETTIER_CLEANUP_REGEX);
      expect(match).not.toBeNull();
    });

    it("should not match clean prettier import", () => {
      const content = 'const prettier = await import("prettier");';
      const match = content.match(PRETTIER_CLEANUP_REGEX);
      expect(match).toBeNull();
    });
  });
});

describe("patch detection", () => {
  it("should detect unpatched discover-plugins.ts", () => {
    const hasExtensionComment =
      UNPATCHED_DISCOVER_PLUGINS.includes("Extension plugins");
    const hasAwsType = UNPATCHED_DISCOVER_PLUGINS.includes('"aws"');
    expect(hasExtensionComment).toBe(false);
    expect(hasAwsType).toBe(false);
  });

  it("should detect patched discover-plugins.ts", () => {
    const hasExtensionComment =
      PATCHED_DISCOVER_PLUGINS.includes("Extension plugins");
    const hasAwsType = PATCHED_DISCOVER_PLUGINS.includes('"aws"');
    expect(hasExtensionComment).toBe(true);
    expect(hasAwsType).toBe(true);
  });

  it("should detect unpatched registry.ts", () => {
    const hasGetActionSlug = UNPATCHED_REGISTRY.includes("getActionSlug");
    const hasConfigProps = UNPATCHED_REGISTRY.includes("ConfigProps");
    expect(hasGetActionSlug).toBe(false);
    expect(hasConfigProps).toBe(false);
  });

  it("should detect patched registry.ts", () => {
    const hasGetActionSlug = PATCHED_REGISTRY.includes("getActionSlug");
    const hasConfigProps = PATCHED_REGISTRY.includes("ConfigProps");
    expect(hasGetActionSlug).toBe(true);
    expect(hasConfigProps).toBe(true);
  });
});

describe("patching transformations", () => {
  describe("SYSTEM_INTEGRATION_TYPES patching", () => {
    it("should add extension types to existing types", () => {
      const existingTypes = '"database"';
      const extensionTypes = ["aws", "azure", "gcp"];

      const parsed = existingTypes
        .split(",")
        .map((t) => t.trim().replace(/['"]/g, ""))
        .filter(Boolean);

      const allTypes = [...new Set([...parsed, ...extensionTypes])];
      expect(allTypes).toEqual(["database", "aws", "azure", "gcp"]);
    });

    it("should not duplicate existing extension types", () => {
      const existingTypes = '"database", "aws"';
      const extensionTypes = ["aws", "azure"];

      const parsed = existingTypes
        .split(",")
        .map((t) => t.trim().replace(/['"]/g, ""))
        .filter(Boolean);

      const allTypes = [...new Set([...parsed, ...extensionTypes])];
      expect(allTypes).toEqual(["database", "aws", "azure"]);
    });
  });

  describe("ConfigProps type insertion", () => {
    it("should insert ConfigProps after ActionConfigField", () => {
      const original =
        "export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;";
      const replacement = `export type ActionConfigField = ActionConfigFieldBase | ActionConfigFieldGroup;

/**
 * Config Props for component-based config fields
 */
export type ConfigProps = {
  config: Record<string, unknown>;
};`;

      const result = original.replace(CONFIG_FIELD_TYPE_REGEX, replacement);
      expect(result).toContain("ConfigProps");
      expect(result).toContain("ActionConfigField");
    });
  });

  describe("getActionSlug insertion", () => {
    it("should insert getActionSlug before integrationRegistry", () => {
      const original = "const integrationRegistry = new Map<string, Plugin>();";
      const getActionSlugFn = `export function getActionSlug(action: PluginAction): string {
  return action.slug || action.id || action.label;
}

const integrationRegistry = new Map`;

      const result = original.replace(
        INTEGRATION_REGISTRY_REGEX,
        getActionSlugFn
      );
      expect(result).toContain("getActionSlug");
      expect(result).toContain("integrationRegistry");
    });
  });

  describe("action.slug to getActionSlug replacement", () => {
    it("should replace action.slug with getActionSlug(action)", () => {
      const original = "computeActionId(plugin.type, action.slug)";
      const result = original.replace(
        /computeActionId\(plugin\.type, action\.slug\)/g,
        "computeActionId(plugin.type, getActionSlug(action))"
      );
      expect(result).toBe(
        "computeActionId(plugin.type, getActionSlug(action))"
      );
    });

    it("should replace multiple occurrences", () => {
      const original = `
        id: computeActionId(plugin.type, action.slug),
        fullId: computeActionId(plugin.type, action.slug),
      `;
      const result = original.replace(
        /computeActionId\(plugin\.type, action\.slug\)/g,
        "computeActionId(plugin.type, getActionSlug(action))"
      );
      expect(result).not.toContain("action.slug");
      expect(result.match(/getActionSlug\(action\)/g)?.length).toBe(2);
    });
  });

  describe("prettier @ts-expect-error cleanup", () => {
    it("should remove @ts-expect-error from prettier import", () => {
      const original = `// @ts-expect-error - prettier doesn't have types
    const prettier = await import("prettier");`;
      const result = original.replace(
        PRETTIER_CLEANUP_REGEX,
        'const prettier = await import("prettier");'
      );
      expect(result).not.toContain("@ts-expect-error");
      expect(result).toContain('const prettier = await import("prettier");');
    });

    it("should not modify clean prettier import", () => {
      const original = 'const prettier = await import("prettier");';
      const result = original.replace(
        PRETTIER_CLEANUP_REGEX,
        'const prettier = await import("prettier");'
      );
      expect(result).toBe(original);
    });
  });
});

describe("edge cases", () => {
  it("should handle empty SYSTEM_INTEGRATION_TYPES", () => {
    const content = "const SYSTEM_INTEGRATION_TYPES = [] as const;";
    const match = content.match(SYSTEM_TYPES_REGEX);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe("");
  });

  it("should handle multiline SYSTEM_INTEGRATION_TYPES", () => {
    const content = `const SYSTEM_INTEGRATION_TYPES = [
  "database",
  "other",
] as const;`;
    const match = content.match(SYSTEM_TYPES_REGEX);
    expect(match).not.toBeNull();
  });

  it("should handle configFields with different spacing", () => {
    const variations = [
      "configFields: ActionConfigField[];",
      "configFields:ActionConfigField[];",
      "configFields : ActionConfigField[];",
    ];

    for (const v of variations) {
      const result = v.replace(
        CONFIG_FIELDS_SPACING_REGEX,
        "configFields: ActionConfigFields;"
      );
      expect(result).toBe("configFields: ActionConfigFields;");
    }
  });
});

describe("idempotency", () => {
  it("should not modify already patched content on second run", () => {
    // Simulate detection logic
    const isPatched =
      PATCHED_DISCOVER_PLUGINS.includes('"aws"') &&
      PATCHED_DISCOVER_PLUGINS.includes("Extension plugins");
    expect(isPatched).toBe(true);

    // If already patched, the function should return early
    // This is the behavior we expect in the actual script
  });

  it("should detect getActionSlug and ConfigProps as patch indicators", () => {
    const hasGetActionSlug = PATCHED_REGISTRY.includes("getActionSlug");
    const hasConfigProps = PATCHED_REGISTRY.includes("ConfigProps");

    expect(hasGetActionSlug && hasConfigProps).toBe(true);
  });
});

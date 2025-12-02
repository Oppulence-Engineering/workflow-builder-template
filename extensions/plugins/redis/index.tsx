import { Database } from "lucide-react";
import type { ExtensionIntegrationPlugin } from "@/extensions/registry";
import { registerExtensionPlugin } from "@/extensions/registry";
import { getValueCodegenTemplate } from "./codegen/get-value";
import { RedisSettings } from "./settings";
import { GetValueConfigFields } from "./steps/get-value/config";

const redisPlugin: ExtensionIntegrationPlugin = {
  type: "redis",
  label: "Redis",
  description: "Redis cache and key-value store",

  icon: Database,

  settingsComponent: RedisSettings,

  formFields: [
    {
      id: "url",
      label: "Connection URL",
      type: "password",
      placeholder: "redis://localhost:6379",
      configKey: "url",
      helpText: "Redis connection string (e.g., redis://user:pass@host:port)",
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.url) {
      creds.REDIS_URL = String(config.url);
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testRedis } = await import("./test");
      return testRedis;
    },
  },

  actions: [
    {
      id: "Get Value",
      label: "Get Value",
      description: "Get a value from Redis by key",
      category: "Redis",
      icon: Database,
      stepFunction: "getValueStep",
      stepImportPath: "get-value",
      configFields: GetValueConfigFields,
      codegenTemplate: getValueCodegenTemplate,
    },
  ],
};

// Auto-register on import
registerExtensionPlugin(redisPlugin);

export default redisPlugin;

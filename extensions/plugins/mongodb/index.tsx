import { Database } from "lucide-react";
import { FindDocumentsConfigFields } from "./steps/find-documents/config";
import type { IntegrationPlugin } from "@/plugins/registry";
import { MongoDBSettings } from "./settings";
import { findDocumentsCodegenTemplate } from "./codegen/find-documents";
import { registerIntegration } from "@/plugins/registry";

const mongodbPlugin: IntegrationPlugin = {
  type: "mongodb" as const,
  label: "MongoDB",
  description: "MongoDB document database",

  icon: Database,

  settingsComponent: MongoDBSettings,

  formFields: [
    {
      id: "connectionString",
      label: "Connection String",
      type: "password",
      placeholder: "mongodb://localhost:27017",
      configKey: "connectionString",
      helpText: "MongoDB connection URI",
    },
    {
      id: "database",
      label: "Database Name",
      type: "text",
      placeholder: "mydb",
      configKey: "database",
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.connectionString) {
      creds.MONGODB_URI = String(config.connectionString);
    }
    if (config.database) {
      creds.MONGODB_DB = String(config.database);
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testMongoDB } = await import("./test");
      return testMongoDB;
    },
  },

  actions: [
    {
      id: "Find Documents",
      label: "Find Documents",
      description: "Query documents from a MongoDB collection",
      category: "MongoDB",
      icon: Database,
      stepFunction: "findDocumentsStep",
      stepImportPath: "find-documents",
      configFields: FindDocumentsConfigFields,
      codegenTemplate: findDocumentsCodegenTemplate,
    },
  ],
};

registerIntegration(mongodbPlugin);

export default mongodbPlugin;

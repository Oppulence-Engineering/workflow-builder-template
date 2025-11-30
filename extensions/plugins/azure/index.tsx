import { AzureSettings } from "./settings";
import { BlobUploadConfigFields } from "./steps/blob-upload/config";
import { Cloud } from "lucide-react";
import type { IntegrationPlugin } from "@/plugins/registry";
import { blobUploadCodegenTemplate } from "./codegen/blob-upload";
import { registerIntegration } from "@/plugins/registry";

const azurePlugin: IntegrationPlugin = {
  type: "azure" as const,
  label: "Azure",
  description: "Microsoft Azure cloud services",

  icon: Cloud,

  settingsComponent: AzureSettings,

  formFields: [
    {
      id: "connectionString",
      label: "Storage Connection String",
      type: "password",
      placeholder: "DefaultEndpointsProtocol=https;AccountName=...",
      configKey: "connectionString",
      helpText: "Azure Storage account connection string from ",
      helpLink: {
        text: "Azure Portal",
        url: "https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Storage%2FStorageAccounts",
      },
    },
    {
      id: "containerName",
      label: "Default Container",
      type: "text",
      placeholder: "my-container",
      configKey: "containerName",
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.connectionString) {
      creds.AZURE_STORAGE_CONNECTION_STRING = String(config.connectionString);
    }
    if (config.containerName) {
      creds.AZURE_CONTAINER = String(config.containerName);
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testAzure } = await import("./test");
      return testAzure;
    },
  },

  actions: [
    {
      id: "Blob Upload",
      label: "Blob Upload",
      description: "Upload a file to Azure Blob Storage",
      category: "Azure",
      icon: Cloud,
      stepFunction: "blobUploadStep",
      stepImportPath: "blob-upload",
      configFields: BlobUploadConfigFields,
      codegenTemplate: blobUploadCodegenTemplate,
    },
  ],
};

registerIntegration(azurePlugin);

export default azurePlugin;

import { Cloud } from "lucide-react";
import type { ExtensionIntegrationPlugin } from "@/extensions/registry";
import { registerExtensionPlugin } from "@/extensions/registry";
import { storageUploadCodegenTemplate } from "./codegen/storage-upload";
import { GCPSettings } from "./settings";
import { StorageUploadConfigFields } from "./steps/storage-upload/config";

const gcpPlugin: ExtensionIntegrationPlugin = {
  type: "gcp",
  label: "Google Cloud",
  description: "Google Cloud Platform services",

  icon: Cloud,

  settingsComponent: GCPSettings,

  formFields: [
    {
      id: "projectId",
      label: "Project ID",
      type: "text",
      placeholder: "my-project-123",
      configKey: "projectId",
      helpText: "Your GCP project ID",
    },
    {
      id: "serviceAccountKey",
      label: "Service Account Key (JSON)",
      type: "password",
      placeholder: '{"type": "service_account", ...}',
      configKey: "serviceAccountKey",
      helpText: "JSON key file content from ",
      helpLink: {
        text: "GCP Console",
        url: "https://console.cloud.google.com/iam-admin/serviceaccounts",
      },
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.projectId) {
      creds.GCP_PROJECT_ID = String(config.projectId);
    }
    if (config.serviceAccountKey) {
      creds.GOOGLE_APPLICATION_CREDENTIALS_JSON = String(
        config.serviceAccountKey
      );
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testGCP } = await import("./test");
      return testGCP;
    },
  },

  actions: [
    {
      id: "Cloud Storage Upload",
      label: "Cloud Storage Upload",
      description: "Upload a file to Google Cloud Storage",
      category: "GCP",
      icon: Cloud,
      stepFunction: "storageUploadStep",
      stepImportPath: "storage-upload",
      configFields: StorageUploadConfigFields,
      codegenTemplate: storageUploadCodegenTemplate,
    },
  ],
};

registerExtensionPlugin(gcpPlugin);

export default gcpPlugin;

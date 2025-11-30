import { AWSSettings } from "./settings";
import { Cloud } from "lucide-react";
import type { IntegrationPlugin } from "@/plugins/registry";
import { InvokeLambdaConfigFields } from "./steps/lambda-invoke/config";
import { InvokeS3ConfigFields } from "./steps/s3-upload/config";
import { lambdaInvokeCodegenTemplate } from "./codegen/lambda-invoke";
import { registerIntegration } from "@/plugins/registry";
import { s3UploadCodegenTemplate } from "./codegen/s3-upload";

const awsPlugin: IntegrationPlugin = {
  type: "aws" as const,
  label: "AWS",
  description: "Amazon Web Services integration",

  icon: Cloud,

  settingsComponent: AWSSettings,

  formFields: [
    {
      id: "accessKeyId",
      label: "Access Key ID",
      type: "text",
      placeholder: "AKIA...",
      configKey: "accessKeyId",
      helpText: "Your AWS Access Key ID from ",
      helpLink: {
        text: "IAM Console",
        url: "https://console.aws.amazon.com/iam/home#/security_credentials",
      },
    },
    {
      id: "secretAccessKey",
      label: "Secret Access Key",
      type: "password",
      placeholder: "Your secret key",
      configKey: "secretAccessKey",
    },
    {
      id: "region",
      label: "Default Region",
      type: "text",
      placeholder: "us-east-1",
      configKey: "region",
    },
  ],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.accessKeyId) {
      creds.AWS_ACCESS_KEY_ID = String(config.accessKeyId);
    }
    if (config.secretAccessKey) {
      creds.AWS_SECRET_ACCESS_KEY = String(config.secretAccessKey);
    }
    if (config.region) {
      creds.AWS_REGION = String(config.region);
    }
    return creds;
  },

  testConfig: {
    getTestFunction: async () => {
      const { testAWS } = await import("./test");
      return testAWS;
    },
  },

  actions: [
    {
      id: "S3 Upload",
      label: "S3 Upload",
      description: "Upload a file to Amazon S3",
      category: "AWS",
      icon: Cloud,
      stepFunction: "s3UploadStep",
      stepImportPath: "s3-upload",
      configFields: InvokeS3ConfigFields,
      codegenTemplate: s3UploadCodegenTemplate,
    },
    {
      id: "Lambda Invoke",
      label: "Lambda Invoke",
      description: "Invoke an AWS Lambda function",
      category: "AWS",
      icon: Cloud,
      stepFunction: "lambdaInvokeStep",
      stepImportPath: "lambda-invoke",
      configFields: InvokeLambdaConfigFields,
      codegenTemplate: lambdaInvokeCodegenTemplate,
    },
  ],
};

// Auto-register on import
registerIntegration(awsPlugin);

export default awsPlugin;

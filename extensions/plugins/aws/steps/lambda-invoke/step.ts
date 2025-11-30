import "server-only";

import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const LambdaInvokeInputSchema = z.object({
  integrationId: z.string().optional(),
  functionName: z.string().min(1, "Function name is required"),
  payload: z.string().optional(),
  invocationType: z
    .enum(["RequestResponse", "Event", "DryRun"])
    .optional()
    .default("RequestResponse"),
});

// Result schema
const LambdaInvokeResultSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  functionError: z.string().optional(),
  executedVersion: z.string().optional(),
  response: z.unknown().optional(),
  error: z.string().optional(),
});

export type LambdaInvokeInput = StepInput &
  z.infer<typeof LambdaInvokeInputSchema>;
export type LambdaInvokeResult = z.infer<typeof LambdaInvokeResultSchema>;

async function lambdaInvoke(
  input: LambdaInvokeInput
): Promise<LambdaInvokeResult> {
  // Validate input with Zod
  const validation = LambdaInvokeInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { functionName, payload, invocationType, integrationId } =
    validation.data;

  // Fetch AWS credentials
  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (!(credentials.AWS_ACCESS_KEY_ID && credentials.AWS_SECRET_ACCESS_KEY)) {
    return {
      success: false,
      error: "AWS credentials not configured",
    };
  }

  // Validate payload is valid JSON if provided
  if (payload) {
    try {
      JSON.parse(payload);
    } catch {
      return {
        success: false,
        error: "Invalid JSON payload",
      };
    }
  }

  try {
    const region = credentials.AWS_REGION || "us-east-1";

    const client = new LambdaClient({
      region,
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY,
      },
    });

    const response = await client.send(
      new InvokeCommand({
        FunctionName: functionName,
        Payload: payload ? new TextEncoder().encode(payload) : undefined,
        InvocationType: invocationType || "RequestResponse",
      })
    );

    // Parse response payload
    let parsedPayload: unknown = null;
    if (response.Payload) {
      const payloadString = new TextDecoder().decode(response.Payload);
      try {
        parsedPayload = JSON.parse(payloadString);
      } catch {
        parsedPayload = payloadString;
      }
    }

    // Check for function errors
    if (response.FunctionError) {
      return {
        success: false,
        statusCode: response.StatusCode,
        functionError: response.FunctionError,
        executedVersion: response.ExecutedVersion,
        response: parsedPayload,
        error: `Lambda function error: ${response.FunctionError}`,
      };
    }

    return {
      success: true,
      statusCode: response.StatusCode,
      executedVersion: response.ExecutedVersion,
      response: parsedPayload,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function lambdaInvokeStep(
  input: LambdaInvokeInput
): Promise<LambdaInvokeResult> {
  "use step";
  return withStepLogging(input, () => lambdaInvoke(input));
}

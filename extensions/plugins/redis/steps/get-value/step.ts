import "server-only";

import Redis from "ioredis";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const GetValueInputSchema = z.object({
  integrationId: z.string().optional(),
  key: z.string().min(1, "Key is required"),
});

// Result schema
const GetValueResultSchema = z.object({
  success: z.boolean(),
  key: z.string(),
  value: z.string().nullable().optional(),
  ttl: z.number().optional(),
  error: z.string().optional(),
});

export type GetValueInput = StepInput & z.infer<typeof GetValueInputSchema>;
export type GetValueResult = z.infer<typeof GetValueResultSchema>;

async function getValue(input: GetValueInput): Promise<GetValueResult> {
  // Validate input with Zod
  const validation = GetValueInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      key: input.key || "",
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { key, integrationId } = validation.data;

  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (!credentials.REDIS_URL) {
    return {
      success: false,
      key,
      error: "Redis credentials not configured",
    };
  }

  let client: Redis | null = null;

  try {
    client = new Redis(credentials.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    const value = await client.get(key);
    const ttl = await client.ttl(key);

    return {
      success: true,
      key,
      value,
      ttl: ttl >= 0 ? ttl : undefined,
    };
  } catch (error) {
    return {
      success: false,
      key,
      error: error instanceof Error ? error.message : "Failed to get value",
    };
  } finally {
    if (client) {
      await client.quit();
    }
  }
}

export async function getValueStep(
  input: GetValueInput
): Promise<GetValueResult> {
  "use step";
  return await withStepLogging(input, () => getValue(input));
}

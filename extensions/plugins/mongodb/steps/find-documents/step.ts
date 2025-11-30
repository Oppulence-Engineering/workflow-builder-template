import "server-only";

import { MongoClient } from "mongodb";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";

// Input schema with Zod validation
const FindDocumentsInputSchema = z.object({
  integrationId: z.string().optional(),
  collection: z.string().min(1, "Collection name is required"),
  filter: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  skip: z.number().min(0).optional().default(0),
  sort: z.string().optional(),
});

// Result schema
const FindDocumentsResultSchema = z.object({
  success: z.boolean(),
  documents: z.array(z.unknown()),
  count: z.number(),
  error: z.string().optional(),
});

export type FindDocumentsInput = StepInput &
  z.infer<typeof FindDocumentsInputSchema>;
export type FindDocumentsResult = z.infer<typeof FindDocumentsResultSchema>;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MongoDB find requires handling many query options
async function findDocuments(
  input: FindDocumentsInput
): Promise<FindDocumentsResult> {
  // Validate input with Zod
  const validation = FindDocumentsInputSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return {
      success: false,
      documents: [],
      count: 0,
      error: `Validation failed: ${errorMessage}`,
    };
  }

  const { collection, filter, limit, skip, sort, integrationId } =
    validation.data;

  const credentials = integrationId
    ? await fetchCredentials(integrationId)
    : {};

  if (!(credentials.MONGODB_URI && credentials.MONGODB_DB)) {
    return {
      success: false,
      documents: [],
      count: 0,
      error: "MongoDB credentials not configured",
    };
  }

  // Parse and validate filter if provided
  let parsedFilter: Record<string, unknown> = {};
  if (filter) {
    try {
      const parsed = JSON.parse(filter);
      // Validate that filter is a plain object (not array, null, or primitive)
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return {
          success: false,
          documents: [],
          count: 0,
          error: "Filter must be a JSON object, not an array or primitive",
        };
      }
      parsedFilter = parsed;
    } catch {
      return {
        success: false,
        documents: [],
        count: 0,
        error: "Invalid JSON filter",
      };
    }
  }

  // Parse and validate sort if provided
  let parsedSort: Record<string, 1 | -1> | undefined;
  if (sort) {
    try {
      const parsed = JSON.parse(sort);
      // Validate that sort is a plain object
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return {
          success: false,
          documents: [],
          count: 0,
          error: "Sort specification must be a JSON object",
        };
      }
      // Validate sort values are only 1 or -1
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== 1 && value !== -1) {
          return {
            success: false,
            documents: [],
            count: 0,
            error: `Invalid sort value for field "${key}": must be 1 (ascending) or -1 (descending)`,
          };
        }
      }
      parsedSort = parsed as Record<string, 1 | -1>;
    } catch {
      return {
        success: false,
        documents: [],
        count: 0,
        error: "Invalid JSON sort specification",
      };
    }
  }

  let client: MongoClient | null = null;

  try {
    client = new MongoClient(credentials.MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10_000,
    });

    await client.connect();

    const db = client.db(credentials.MONGODB_DB);
    const coll = db.collection(collection);

    // Build query
    let cursor = coll.find(parsedFilter);

    if (parsedSort) {
      cursor = cursor.sort(parsedSort);
    }

    cursor = cursor.skip(skip).limit(Math.min(limit, 1000)); // Safety cap at 1000

    const documents = await cursor.toArray();

    return {
      success: true,
      documents,
      count: documents.length,
    };
  } catch (error) {
    return {
      success: false,
      documents: [],
      count: 0,
      error:
        error instanceof Error ? error.message : "Failed to query documents",
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function findDocumentsStep(
  input: FindDocumentsInput
): Promise<FindDocumentsResult> {
  "use step";
  return await withStepLogging(input, () => findDocuments(input));
}

import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

/**
 * Test AWS credentials by calling STS GetCallerIdentity
 * Uses the AWS SDK to properly sign the request
 */
export async function testAWS(
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } =
      credentials;

    if (!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY)) {
      return {
        success: false,
        error: "Missing AWS credentials",
      };
    }

    const region = AWS_REGION || "us-east-1";

    // Create STS client with the provided credentials
    const client = new STSClient({
      region,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Call GetCallerIdentity to verify the credentials are valid
    try {
      const response = await client.send(new GetCallerIdentityCommand({}));

      if (response.Account && response.Arn) {
        return { success: true };
      }

      return {
        success: false,
        error: "Credentials are valid but returned unexpected response",
      };
    } finally {
      // Cleanup: destroy the client to release resources
      client.destroy();
    }
  } catch (error) {
    // Handle common AWS errors
    if (error instanceof Error) {
      if (error.name === "InvalidClientTokenId") {
        return {
          success: false,
          error: "Invalid Access Key ID",
        };
      }
      if (error.name === "SignatureDoesNotMatch") {
        return {
          success: false,
          error: "Invalid Secret Access Key",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Unknown error verifying credentials",
    };
  }
}

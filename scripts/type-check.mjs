import { execSync } from "node:child_process";

/**
 * Wrapper that runs the project type-check while ignoring any extra args that
 * lint-staged forwards. This keeps the behavior consistent locally and in CI.
 */
try {
  execSync("pnpm exec tsc --noEmit", { stdio: "inherit" });
} catch (error) {
  if (typeof error?.status === "number") {
    process.exit(error.status);
  }
  throw error;
}

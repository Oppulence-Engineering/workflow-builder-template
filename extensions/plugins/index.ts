/**
 * Fork-Specific Plugins
 *
 * Register all fork-specific integration plugins here.
 * Each plugin auto-registers when imported.
 */

// Cloud Providers
// import "./aws";
// import "./gcp";
// import "./azure";

// Database Connectors
// import "./mongodb";
// import "./redis";
// import "./elasticsearch";

// Internal APIs
// import "./internal-api";

// Lead Scraper
import "./lead-scraper";

// Export plugin types for external use
export type { ExtensionPluginConfig } from "./types";

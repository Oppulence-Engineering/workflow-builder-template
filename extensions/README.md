# Fork-Specific Extensions

This directory contains components, plugins, and features specific to the Oppulence Engineering fork.

**Why this directory exists:**
- Isolates fork-specific code from upstream to minimize merge conflicts
- Allows parallel development without touching core upstream files
- Makes it clear what's custom vs. upstream

## Directory Structure

```
extensions/
├── plugins/           # Fork-specific integration plugins
│   ├── aws/           # AWS services (S3, Lambda, SQS, etc.)
│   ├── gcp/           # Google Cloud Platform
│   ├── azure/         # Microsoft Azure
│   ├── mongodb/       # MongoDB connector
│   ├── redis/         # Redis connector
│   └── internal-api/  # Internal API connector template
│
├── nodes/             # Custom workflow node types
│   └── index.ts       # Node type registry extension
│
├── components/        # Fork-specific UI components
│   ├── admin/         # Admin panel components
│   └── dashboard/     # Custom dashboards
│
├── hooks/             # Custom React hooks
│
└── index.ts           # Main export file
```

## Adding a New Plugin

1. Create a directory in `extensions/plugins/[plugin-name]/`
2. Follow the same structure as `plugins/` (index.tsx, settings.tsx, test.ts, steps/)
3. Import and register in `extensions/plugins/index.ts`
4. Run `pnpm discover-plugins` to update types

## Adding a Custom Node Type

1. Create the node component in `extensions/nodes/`
2. Register it in `extensions/nodes/index.ts`
3. The main `workflow-canvas.tsx` will pick it up automatically

## Merge Strategy

When syncing with upstream:
- This entire directory is fork-only, so no conflicts expected
- Only `extensions/index.ts` needs to be imported in one place in the main codebase

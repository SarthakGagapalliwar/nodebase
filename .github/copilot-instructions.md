# Copilot Instructions for Nodebase

## Project Overview

Nodebase is a **workflow automation builder** built with Next.js 15 (App Router + Turbopack). Users create visual workflows using a node-based editor (React Flow), with background job execution via Inngest and AI integrations (Google, OpenAI, Mistral).

## CRITICAL RULES

1. _Adaptive refactoring_: When modifying code, if you stumble upon sloppy code even if it's not directly related, refactor that code to improve clarity and maintainability.
2. _Adaptive knowledge_: When working on a feature, familiarize yourself with all related files (e.g. DB schema, oRPC router, events, client code) to ensure holistic understanding and improvements and at the end update this doc with any new insights.
3. _Thorough implementation_: When making changes to a feature, ensure all related aspects (DB schema, oRPC procedures, frontend code, events) are updated accordingly to maintain consistency and functionality.

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **State**: tRPC + TanStack Query (server), Jotai (client atoms)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: better-auth with Polar subscriptions
- **UI**: Tailwind CSS v4, shadcn/ui (new-york style), Radix primitives
- **Workflow Editor**: @xyflow/react (React Flow)
- **Background Jobs**: Inngest

### Key Directories

```
src/
├── features/           # Domain-specific modules (preferred for new features)
│   ├── workflows/      # Workflow CRUD, hooks, server routers
│   ├── editor/         # React Flow editor, atoms store
│   ├── triggers/       # Trigger node types (ManualTrigger)
│   ├── execution/      # Execution node types (HttpRequest)
│   └── auth/           # Auth components
├── components/
│   ├── ui/             # shadcn/ui components (DO NOT modify directly)
│   └── react-flow/     # Base node/handle components for workflow editor
├── trpc/               # tRPC setup and routers
├── lib/                # Shared utilities (auth, db, polar, utils)
└── config/             # Constants and node registry
```

## Critical Patterns

### Feature Module Structure

New features should follow `src/features/{feature-name}/`:

- `components/` - React components
- `hooks/` - Custom hooks with tRPC queries/mutations
- `server/` - tRPC routers and server-side logic
- `store/` - Jotai atoms for client state

### tRPC Procedures

Located in `src/trpc/init.ts`:

- `baseProcedure` - Public endpoints
- `protectedProcedure` - Requires authenticated session
- `premiumProcedure` - Requires active Polar subscription

### Adding New Workflow Node Types

1. Add enum value to `NodeType` in `prisma/schema.prisma`
2. Create node component in appropriate feature folder using base patterns:
   - Triggers: extend `BaseTriggerNode` from `features/triggers/components/`
   - Execution: extend `BaseExecutionNode` from `features/execution/components/`
3. Register in `src/config/node-components.ts`

### React Flow Node Pattern

```tsx
// Nodes must be memoized and use base components
import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseTriggerNode } from "../base-trigger-node"; // or BaseExecutionNode

export const MyNode = memo((props: NodeProps) => {
  return <BaseTriggerNode {...props} icon={MyIcon} name="My Node" />;
});
```

## Development Commands

```bash
npm run dev:all      # Start Next.js + Inngest dev server (via mprocs)
npm run dev          # Next.js only (Turbopack)
npm run inngest:dev  # Inngest dev server only
npm run lint         # Biome check
npm run format       # Biome format
```

## Code Style

- **Linter/Formatter**: Biome (NOT ESLint/Prettier)
- **Imports**: Use `@/` path aliases (defined in tsconfig)
- **Forms**: react-hook-form + zod validation
- **Toasts**: sonner (via `toast.success()`, `toast.error()`)
- **URL State**: nuqs for query parameter state

## Database Changes

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

## Key Files Reference

- `src/config/node-components.ts` - Node type registry for React Flow
- `src/trpc/routers/_app.ts` - Root tRPC router
- `src/inngest/functions.ts` - Background job definitions
- `src/lib/auth.ts` - better-auth configuration with Polar
- `components.json` - shadcn/ui configuration

## New Insights

- Anthropic execution node added (`NodeType.ANTHROPIC`), registered in `node-components` and exposed in the node selector with `/logos/anthropic.svg`.
- Anthropic realtime channel lives at `src/inngest/channels/anthropic.ts` (`anthropic-execution` topic `status`), included in `inngest/functions.ts` channels.
- Anthropic executor uses `@ai-sdk/anthropic` with model `claude-3-5-sonnet-latest`; requires `ANTHROPIC_API_KEY` to run and publishes status updates via the anthropic channel.

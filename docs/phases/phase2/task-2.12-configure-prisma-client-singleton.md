---
task_id: 'task-2.12'
title: 'Configure Prisma Client Singleton'
phase: 2
task_number: 12
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.1'
blocks:
  - 'task-2.13'
  - 'task-2.15'
created_at: '2026-02-18'
---

# Configure Prisma Client Singleton

## Current State

> Prisma has been initialized (task 2.1) and the schema is being defined (tasks 2.2–2.11). The application needs a singleton Prisma client instance to prevent creating multiple database connections during development hot reloads.

- **What exists**: `src/lib/utils.ts` — the only file in `src/lib/`. No database client file exists.
- **What is missing**: `src/lib/db.ts` (or `src/lib/prisma.ts`) with a singleton Prisma client
- **Relevant code**:
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.12: "Create `src/lib/db.ts` with a singleton Prisma client instance"
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — File structure shows `src/lib/prisma.ts` as "Prisma client singleton"
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Architecture shows Prisma as the ORM

---

## Desired Outcome

- **End state**: A `src/lib/db.ts` file exports a singleton `prisma` client instance using the global singleton pattern for Next.js development compatibility.
- **User-facing changes**: None
- **Developer-facing changes**: `import { prisma } from '@/lib/db'` available for use across the application

---

## Scope & Boundaries

### In Scope

- Create `src/lib/db.ts` with the Prisma client singleton pattern
- Use the global variable pattern to prevent multiple instances during Next.js hot reload
- Export the `prisma` client for use across the application

### Out of Scope

- Using the client to query the database (that happens in API routes, Phase 3+)
- Configuring logging or query events on the client
- Creating any other utility files in `src/lib/`
- Running migrations (handled in task 2.13)

### Dependencies

- Task 2.1 (Initialize Prisma) — `@prisma/client` must be available and schema must exist

---

## Implementation Details

### Section 1: Create Prisma Client Singleton

**What to do**: Create `src/lib/db.ts` with the standard Next.js Prisma singleton pattern.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.12
- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — `src/lib/prisma.ts` in the file structure
- Prisma official docs: "Best practice for instantiating PrismaClient with Next.js"

**Specific requirements**:

- Import `PrismaClient` from `@prisma/client`
- Use the `globalThis` pattern to store the client instance in development:

  ```typescript
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  export const prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
  ```

- Export the `prisma` instance as a named export
- Do NOT add query logging or middleware at this point

**File naming note**: ROADMAP uses `db.ts`, SENIOR_DEVELOPER.md uses `prisma.ts`. Use `db.ts` as specified by the ROADMAP since that is the task-level specification. The import path will be `@/lib/db`.

**Patterns to follow**:

- Standard Next.js + Prisma singleton pattern from Prisma official documentation
- TypeScript strict mode compatible (the `tsconfig.json` has `strict: true`)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `src/lib/db.ts` file exists
- [ ] File exports a `prisma` instance of type `PrismaClient`
- [ ] Global singleton pattern prevents multiple instances in development
- [ ] Import `import { prisma } from '@/lib/db'` resolves correctly (path alias works)

### Code Quality Checks

- [ ] Follows the established Prisma singleton pattern
- [ ] No hardcoded values
- [ ] No TODO/FIXME comments left unresolved within this task's scope

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_

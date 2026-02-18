---
task_id: 'task-2.6'
title: 'Configure Prisma Client & Run Migration'
phase: 2
task_number: 6
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.5'
blocks:
  - 'task-2.7'
  - 'task-2.8'
created_at: '2026-02-18'
---

# Configure Prisma Client & Run Migration

## Current State

> Tasks 2.1–2.5 have fully defined the Prisma schema (datasource, generator, enums, all models, indexes). The application needs a singleton Prisma client instance and the schema needs to be applied to the database via an initial migration.

- **What exists**: Complete `prisma/schema.prisma` with all models and indexes; `src/lib/utils.ts` is the only file in `src/lib/`; `.env.local` with `DATABASE_URL` placeholder
- **What is missing**: `src/lib/db.ts` with Prisma client singleton; initial migration in `prisma/migrations/`; generated Prisma client types
- **Relevant code**:
  - `prisma/schema.prisma` — source of truth for the migration
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Tasks 2.12 and 2.13 descriptions
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — File structure shows `src/lib/prisma.ts` as "Prisma client singleton"; Phase 1 step 5: "Run initial migration"

---

## Desired Outcome

- **End state**: A `src/lib/db.ts` file exports a singleton `prisma` client instance. The initial migration is created and applied to the Neon PostgreSQL database. All tables, indexes, and constraints exist in the database. Prisma client types are generated and available for TypeScript imports.
- **User-facing changes**: None
- **Developer-facing changes**:
  - `src/lib/db.ts` — Prisma client singleton (`import { prisma } from '@/lib/db'`)
  - `prisma/migrations/` directory with the initial migration
  - Generated Prisma client with full TypeScript types for all models

---

## Scope & Boundaries

### In Scope

- Create `src/lib/db.ts` with the Prisma client singleton pattern
- Validate the schema (`npx prisma validate`)
- Run the initial migration (`npx prisma migrate dev --name init`)
- Run Prisma client generation (`npx prisma generate`)
- Verify TypeScript types are available for all models
- Verify the project builds successfully

### Out of Scope

- Full-text search setup (requires raw SQL migration — handled in task 2.7)
- Seeding the database (handled in task 2.8)
- Adding database utility scripts to `package.json` (handled in task 2.8)
- Modifying the Prisma schema

### Dependencies

- Task 2.5 (Add Database Indexes) — all schema definitions and indexes must be complete
- A valid `DATABASE_URL` in `.env.local` pointing to a Neon PostgreSQL database

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

**File naming note**: ROADMAP uses `db.ts`, SENIOR_DEVELOPER.md uses `prisma.ts`. Use `db.ts` as specified by the ROADMAP. The import path will be `@/lib/db`.

---

### Section 2: Validate Schema

**What to do**: Run `npx prisma validate` to ensure the schema is syntactically and semantically valid before attempting a migration.

**Specific requirements**:

- Run `npx prisma validate`
- Confirm output shows no errors
- If validation fails, fix the schema errors before proceeding

---

### Section 3: Run Initial Migration

**What to do**: Run the initial migration to create all database tables.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.13
- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 1 step 5

**Specific requirements**:

- Ensure `DATABASE_URL` is set in `.env.local` and points to a valid Neon PostgreSQL database
- Run `npx prisma migrate dev --name init`
- This creates a migration file in `prisma/migrations/<timestamp>_init/migration.sql`
- Review the generated `migration.sql` to verify:
  - All model tables are created (User, Account, Session, VerificationToken, Recipe, RecipeImage, Ingredient, RecipeIngredient, RecipeStep, DietaryTag, RecipeDietaryTag, UserRecipeTag, SavedRecipe, RecipeShare, ShareLink, Rating, Comment, ShoppingList, ShoppingListItem)
  - All indexes are present
  - All unique constraints are present
  - All foreign key constraints with correct `ON DELETE` behavior (CASCADE where specified)
  - All enum types are created

---

### Section 4: Generate Prisma Client and Build Verification

**What to do**: Run `npx prisma generate` and verify the project builds.

**Specific requirements**:

- Run `npx prisma generate`
- Verify the generated client includes types for all models
- Verify that `import { prisma } from '@/lib/db'` resolves without TypeScript errors
- Run `npm run build` and confirm the build succeeds without errors

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npx prisma validate` passes without errors
- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `src/lib/db.ts` file exists and exports a `prisma` instance of type `PrismaClient`
- [ ] Global singleton pattern prevents multiple instances in development
- [ ] `import { prisma } from '@/lib/db'` resolves correctly
- [ ] `prisma/migrations/` directory exists with at least one migration folder
- [ ] Migration SQL file contains CREATE TABLE for all 19 models
- [ ] Migration SQL file contains all enum types, indexes, and unique constraints
- [ ] `npx prisma generate` runs successfully
- [ ] Prisma client TypeScript types are available for all models

### Code Quality Checks

- [ ] Follows the established Prisma singleton pattern
- [ ] No manual edits to the generated migration SQL
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

---
task_id: 'task-2.13'
title: 'Run Initial Migration'
phase: 2
task_number: 13
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.2'
  - 'task-2.3'
  - 'task-2.4'
  - 'task-2.5'
  - 'task-2.6'
  - 'task-2.7'
  - 'task-2.8'
  - 'task-2.9'
  - 'task-2.10'
  - 'task-2.11'
  - 'task-2.12'
blocks:
  - 'task-2.14'
  - 'task-2.15'
created_at: '2026-02-18'
---

# Run Initial Migration

## Current State

> Tasks 2.1–2.12 have fully defined the Prisma schema (datasource, generator, enums, all models, indexes) and configured the Prisma client singleton. The schema has not been applied to the database yet — no migration has been run.

- **What exists**: Complete `prisma/schema.prisma` with all models and indexes; `src/lib/db.ts` with Prisma client singleton; `.env.local` with `DATABASE_URL` placeholder
- **What is missing**: Initial migration in `prisma/migrations/`, generated Prisma client types
- **Relevant code**:
  - `prisma/schema.prisma` — source of truth for the migration
  - `src/lib/db.ts` — Prisma client singleton (depends on generated client)
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.13: "Run `npx prisma migrate dev --name init`"
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 1 step 5: "Run initial migration: `npx prisma migrate dev --name init`"

---

## Desired Outcome

- **End state**: The initial migration is created and applied to the Neon PostgreSQL database. All tables, indexes, and constraints exist in the database. Prisma client types are generated and available for TypeScript imports.
- **User-facing changes**: None
- **Developer-facing changes**: `prisma/migrations/` directory with the initial migration; generated Prisma client with full TypeScript types for all models

---

## Scope & Boundaries

### In Scope

- Validate the schema before migrating (`npx prisma validate`)
- Run the initial migration (`npx prisma migrate dev --name init`)
- Verify the generated migration SQL is correct (all tables, indexes, constraints)
- Run Prisma client generation (`npx prisma generate`)
- Verify TypeScript types are available for all models

### Out of Scope

- Full-text search setup (requires raw SQL migration — handled in task 2.14)
- Seeding the database (handled in task 2.15)
- Adding database utility scripts to `package.json` (handled in task 2.16)
- Modifying the Prisma schema — this task only runs the migration

### Dependencies

- Tasks 2.2–2.11 (all schema definitions and indexes must be complete)
- Task 2.12 (Prisma client singleton must exist to verify generated types)
- A valid `DATABASE_URL` in `.env.local` pointing to a Neon PostgreSQL database

---

## Implementation Details

### Section 1: Validate Schema

**What to do**: Run `npx prisma validate` to ensure the schema is syntactically and semantically valid before attempting a migration.

**Where to find context**:

- `prisma/schema.prisma` — the schema to validate

**Specific requirements**:

- Run `npx prisma validate`
- Confirm output shows no errors
- If validation fails, fix the schema errors before proceeding (this may require revisiting tasks 2.2–2.11)

---

### Section 2: Run Initial Migration

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

**Important notes**:

- If the database already has tables from a previous attempt, `prisma migrate dev` will handle this — it may prompt to reset the database
- The migration is applied to the development database only. Production uses `prisma migrate deploy`

---

### Section 3: Generate Prisma Client

**What to do**: Run `npx prisma generate` to generate the TypeScript client.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.13: "Run `npx prisma generate` to generate the Prisma client types"

**Specific requirements**:

- Run `npx prisma generate`
- Verify the generated client includes types for all models
- Verify that `import { prisma } from '@/lib/db'` resolves without TypeScript errors
- Verify that model types are available (e.g., `PrismaClient`, `Recipe`, `User`, etc.)

---

### Section 4: Build Verification

**What to do**: Run the project build to confirm no TypeScript errors were introduced.

**Specific requirements**:

- Run `npm run build`
- Confirm the build succeeds without errors
- No new TypeScript errors or warnings

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npx prisma validate` passes without errors
- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `prisma/migrations/` directory exists with at least one migration folder
- [ ] Migration SQL file contains CREATE TABLE for all 19 models
- [ ] Migration SQL file contains all enum types
- [ ] Migration SQL file contains all indexes and unique constraints
- [ ] `npx prisma generate` runs successfully
- [ ] Prisma client TypeScript types are available for all models
- [ ] `import { prisma } from '@/lib/db'` resolves correctly in TypeScript

### Code Quality Checks

- [ ] No manual edits to the generated migration SQL
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

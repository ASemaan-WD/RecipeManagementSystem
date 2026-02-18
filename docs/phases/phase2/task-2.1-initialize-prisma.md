---
task_id: 'task-2.1'
title: 'Initialize Prisma'
phase: 2
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-1.2'
blocks:
  - 'task-2.2'
  - 'task-2.3'
  - 'task-2.4'
  - 'task-2.5'
  - 'task-2.6'
created_at: '2026-02-18'
---

# Initialize Prisma

## Current State

> Phase 1 is complete. The project has been scaffolded with Next.js 14+, TypeScript, Tailwind CSS, ESLint, Prettier, and shadcn/ui. Core dependencies including `prisma` and `@prisma/client` are already installed (see `package.json`). However, Prisma has NOT been initialized — there is no `prisma/` directory, no `schema.prisma` file, and no database connection configured.

- **What exists**: `package.json` lists `prisma` (^7.4.0) and `@prisma/client` (^7.4.0) as dependencies. `.env.example` contains a `DATABASE_URL=` placeholder. `.env.local` exists (git-ignored).
- **What is missing**: The `prisma/` directory, `schema.prisma` file, and the actual Neon PostgreSQL connection string in `.env.local`.
- **Relevant code**:
  - [package.json](package.json) — dependencies already installed
  - [.env.example](.env.example) — `DATABASE_URL=` placeholder on line 2
  - [.env.local](.env.local) — needs actual `DATABASE_URL` value

---

## Desired Outcome

- **End state**: A `prisma/schema.prisma` file exists with the datasource configured for PostgreSQL (Neon), the Prisma client generator is set up, and the project is ready for model definitions in subsequent tasks.
- **User-facing changes**: None — this is infrastructure setup.
- **Developer-facing changes**:
  - `prisma/schema.prisma` file created with datasource and generator blocks
  - `.env.local` contains a valid `DATABASE_URL` pointing to a Neon PostgreSQL database

---

## Scope & Boundaries

### In Scope

- Run `npx prisma init` to create the `prisma/` directory and `schema.prisma` file
- Set the datasource provider to `postgresql`
- Configure the generator for `@prisma/client`
- Verify `DATABASE_URL` placeholder exists in `.env.example` (it already does)
- Add the actual Neon connection string to `.env.local` (or document that the developer must do this)

### Out of Scope

- Defining any models or enums (handled in tasks 2.2–2.4)
- Running migrations (handled in task 2.6)
- Configuring the Prisma client singleton in application code (handled in task 2.6)
- Adding preview features (only add if specifically required by a later task)

### Dependencies

- Task 1.2 (Install Core Dependencies) must be complete — `prisma` and `@prisma/client` packages must be installed

---

## Implementation Details

### Section 1: Run Prisma Init

**What to do**: Initialize Prisma in the project by running `npx prisma init`.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Database" section specifies PostgreSQL on Neon
- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.1 description

**Specific requirements**:

- The command creates `prisma/schema.prisma` and may update `.env`
- If `prisma init` overwrites `.env`, ensure `.env.local` is preserved (it should not be affected)
- The `prisma/` directory should be at the project root, NOT inside `src/`

**Patterns to follow**:

- Per [docs/CTO_SPECS.md](docs/CTO_SPECS.md), the project structure shows `prisma/` at the root level alongside `src/`

---

### Section 2: Configure schema.prisma

**What to do**: Edit `prisma/schema.prisma` to set the correct datasource and generator configuration.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Database" section: PostgreSQL, Neon hosting
- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 1 step 3: "Set up Prisma with Neon PostgreSQL connection (serverless driver)"

**Specific requirements**:

- Datasource provider must be `"postgresql"`
- Datasource URL must reference `DATABASE_URL` from environment
- Generator must target `"prisma-client-js"`
- The schema file should contain ONLY the datasource and generator blocks — no models yet (those are defined in tasks 2.2–2.4)

**Expected `schema.prisma` content after this task**:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Patterns to follow**:

- Standard Prisma setup per official Prisma documentation
- The CTO_SPECS.md database schema section shows the schema without any special preview features, so none need to be added at this time

---

### Section 3: Verify Environment Variable

**What to do**: Confirm that `DATABASE_URL` exists in `.env.example` and that `.env.local` has a placeholder or instruction for the developer to fill in the Neon connection string.

**Where to find context**:

- [.env.example](.env.example) — already contains `DATABASE_URL=` on line 2
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Environment Variables section shows format: `DATABASE_URL=postgresql://...@neon.tech/recipe_db`

**Specific requirements**:

- `.env.example` already has the placeholder — no changes needed
- If `.env.local` does not have `DATABASE_URL`, add a placeholder comment or value
- Do NOT commit real database credentials

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `prisma/schema.prisma` file exists at the project root
- [ ] `schema.prisma` contains a `datasource db` block with `provider = "postgresql"`
- [ ] `schema.prisma` contains a `generator client` block with `provider = "prisma-client-js"`
- [ ] `schema.prisma` references `env("DATABASE_URL")` for the connection URL
- [ ] `npx prisma validate` runs without errors (schema is syntactically valid)
- [ ] `.env.example` contains `DATABASE_URL=`

### Code Quality Checks

- [ ] No hardcoded database connection strings in any file
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

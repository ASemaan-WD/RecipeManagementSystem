---
task_id: 'task-2.16'
title: 'Add Database Utility Scripts'
phase: 2
task_number: 16
status: 'pending'
priority: 'low'
dependencies:
  - 'task-2.13'
blocks: []
created_at: '2026-02-18'
---

# Add Database Utility Scripts

## Current State

> Tasks 2.1–2.15 have completed the full database setup: schema definition, migration, full-text search, Prisma client singleton, and seed script. The `package.json` currently has standard Next.js scripts (`dev`, `build`, `start`, `lint`, `format`, `format:check`, `prepare`) but no database convenience scripts.

- **What exists**: `package.json` with Next.js and tooling scripts; Prisma CLI available via `npx prisma`
- **What is missing**: Convenience scripts for common database operations (`db:push`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`)
- **Relevant code**:
  - `package.json` — target file for script additions
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.16: lists all utility scripts to add

---

## Desired Outcome

- **End state**: `package.json` includes 5 convenience scripts for database operations, allowing developers to use `npm run db:push`, `npm run db:migrate`, etc. instead of remembering full Prisma CLI commands.
- **User-facing changes**: None
- **Developer-facing changes**: Convenient `npm run db:*` scripts available in the project

---

## Scope & Boundaries

### In Scope

- Add 5 database utility scripts to the `scripts` section of `package.json`:
  - `db:push` — quick schema push without migration
  - `db:migrate` — create migration
  - `db:seed` — run seed
  - `db:studio` — open Prisma Studio GUI
  - `db:reset` — reset database

### Out of Scope

- Adding any other scripts beyond the 5 listed above
- Modifying existing scripts
- Adding a `postinstall` script for `prisma generate` (could be considered but is not in the ROADMAP)
- Creating a `db:generate` script (can be added later if needed)

### Dependencies

- Task 2.13 (Initial migration must be complete — Prisma CLI commands reference the migration history)

---

## Implementation Details

### Section 1: Add Database Scripts

**What to do**: Add 5 convenience scripts to the `scripts` section of `package.json`.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.16

**Specific requirements**:
Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

**Script purposes**:

- `db:push` — Pushes the Prisma schema state to the database without creating a migration file. Useful during rapid prototyping.
- `db:migrate` — Creates a new migration based on schema changes and applies it. This is the standard workflow for schema changes.
- `db:seed` — Runs the seed script defined in the `prisma.seed` config of `package.json` (configured in task 2.15).
- `db:studio` — Opens Prisma Studio, a GUI for browsing and editing database data. Runs on `localhost:5555`.
- `db:reset` — Resets the database by dropping all tables, re-applying all migrations, and re-running the seed script. **Destructive** — only for development.

**Placement**: Add these scripts after the existing `prepare` script, grouped together for readability.

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] `package.json` is valid JSON

### Functional Verification

- [ ] `npm run db:push` runs without errors (or shows expected Prisma output)
- [ ] `npm run db:migrate` runs without errors (no pending changes = no new migration)
- [ ] `npm run db:seed` runs without errors (seed script executes)
- [ ] `npm run db:studio` launches Prisma Studio (can be verified by checking it starts)
- [ ] `npm run db:reset` runs (may prompt for confirmation — this is expected)

### Code Quality Checks

- [ ] All 5 scripts match the ROADMAP specification exactly
- [ ] Scripts are grouped logically in `package.json`
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

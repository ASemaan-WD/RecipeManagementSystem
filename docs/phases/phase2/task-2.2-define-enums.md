---
task_id: 'task-2.2'
title: 'Define Enums'
phase: 2
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.1'
blocks:
  - 'task-2.3'
  - 'task-2.5'
  - 'task-2.6'
  - 'task-2.7'
created_at: '2026-02-18'
---

# Define Enums

## Current State

> Task 2.1 has initialized Prisma with a `prisma/schema.prisma` file containing the datasource and generator blocks. No enums or models are defined yet.

- **What exists**: `prisma/schema.prisma` with datasource (PostgreSQL/Neon) and generator (prisma-client-js) configured
- **What is missing**: All four enums required by the data model
- **Relevant code**:
  - `prisma/schema.prisma` — target file for enum definitions
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Database Schema (Locked)" section, lines 320–342, defines all enums exactly

---

## Desired Outcome

- **End state**: Four enums (`Difficulty`, `Visibility`, `TagStatus`, `ImageSource`) are defined in `prisma/schema.prisma`, exactly matching the locked CTO schema.
- **User-facing changes**: None
- **Developer-facing changes**: Enum types available in the Prisma schema for use in model definitions in subsequent tasks

---

## Scope & Boundaries

### In Scope

- Add the four enums to `prisma/schema.prisma`: `Difficulty`, `Visibility`, `TagStatus`, `ImageSource`
- Each enum must exactly match the values specified in CTO_SPECS.md

### Out of Scope

- Defining any models (handled in tasks 2.3–2.10)
- Running migrations (handled in task 2.13)
- Any modifications to the datasource or generator blocks

### Dependencies

- Task 2.1 (Initialize Prisma) must be complete

---

## Implementation Details

### Section 1: Add Enums to schema.prisma

**What to do**: Add all four enum definitions to `prisma/schema.prisma` below the generator and datasource blocks.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 318–342, "Database Schema (Locked)" section, "ENUMS" subsection

**Specific requirements**:

- `Difficulty` enum with values: `EASY`, `MEDIUM`, `HARD`
- `Visibility` enum with values: `PRIVATE`, `SHARED`, `PUBLIC`
- `TagStatus` enum with values: `FAVORITE`, `TO_TRY`, `MADE_BEFORE`
- `ImageSource` enum with values: `UPLOAD`, `URL`, `AI_GENERATED`
- Values must be uppercase as shown in CTO_SPECS.md
- Add comments to clarify the purpose of each enum value where specified in CTO_SPECS.md (e.g., `UPLOAD // Cloudinary upload`)

**Patterns to follow**:

- Exact enum definitions from [docs/CTO_SPECS.md](docs/CTO_SPECS.md) lines 320–342

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `prisma/schema.prisma` contains `enum Difficulty` with values `EASY`, `MEDIUM`, `HARD`
- [ ] `prisma/schema.prisma` contains `enum Visibility` with values `PRIVATE`, `SHARED`, `PUBLIC`
- [ ] `prisma/schema.prisma` contains `enum TagStatus` with values `FAVORITE`, `TO_TRY`, `MADE_BEFORE`
- [ ] `prisma/schema.prisma` contains `enum ImageSource` with values `UPLOAD`, `URL`, `AI_GENERATED`
- [ ] `npx prisma validate` runs without errors

### Code Quality Checks

- [ ] Enum values exactly match the CTO_SPECS.md locked schema
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

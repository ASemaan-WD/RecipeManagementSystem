---
task_id: 'task-2.3'
title: 'Define User Model'
phase: 2
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.2'
blocks:
  - 'task-2.4'
  - 'task-2.5'
  - 'task-2.7'
  - 'task-2.8'
  - 'task-2.9'
  - 'task-2.10'
created_at: '2026-02-18'
---

# Define User Model

## Current State

> Task 2.2 has added all four enums to `prisma/schema.prisma`. No models are defined yet.

- **What exists**: `prisma/schema.prisma` with datasource, generator, and enums (`Difficulty`, `Visibility`, `TagStatus`, `ImageSource`)
- **What is missing**: The `User` model and all its fields and relation stubs
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 346–360, `User` model definition
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.3 description
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Username rules: alphanumeric + underscores, 3-20 chars, case-sensitive, unique

---

## Desired Outcome

- **End state**: The `User` model is defined in `prisma/schema.prisma` with all fields and relation stubs exactly matching the CTO_SPECS.md locked schema. Relation targets that don't exist yet (e.g., `Recipe`, `UserRecipeTag`) will cause Prisma validation to fail, which is expected — they will be resolved as subsequent tasks add those models.
- **User-facing changes**: None
- **Developer-facing changes**: `User` model definition in the Prisma schema

---

## Scope & Boundaries

### In Scope

- Define the `User` model with all fields per CTO_SPECS.md
- Include all relation field declarations (even though target models don't exist yet)
- Include the `username` field with `@unique` constraint as specified

### Out of Scope

- Defining the `Account`, `Session`, or `VerificationToken` models (handled in task 2.4)
- Defining the `Recipe` or other related models (handled in tasks 2.5–2.10)
- Adding `emailVerified` field — NOTE: CTO_SPECS.md `User` model does NOT include `emailVerified`, though ROADMAP Task 2.3 mentions it. Follow CTO_SPECS.md as the locked source of truth. If needed for NextAuth adapter, task 2.4 will address it.
- Running migrations (handled in task 2.13)

### Dependencies

- Task 2.2 (Define Enums) must be complete

---

## Implementation Details

### Section 1: Add User Model to schema.prisma

**What to do**: Add the `User` model definition to `prisma/schema.prisma`.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 346–360, exact `User` model

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String, optional (`?`)
- `email`: String, `@unique`
- `username`: String, optional (`?`), `@unique` — for share-by-username lookup
- `image`: String, optional (`?`)
- `recipes`: `Recipe[]` relation with name `"AuthoredRecipes"`
- `tags`: `UserRecipeTag[]`
- `savedRecipes`: `SavedRecipe[]`
- `ratings`: `Rating[]`
- `comments`: `Comment[]`
- `sharedWithMe`: `RecipeShare[]`
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`

**Important notes**:

- The CTO_SPECS.md locked schema does NOT include `emailVerified` or NextAuth-specific fields (`accounts`, `sessions`) on the `User` model. Those will be handled in task 2.4, which may need to add fields to `User` for NextAuth adapter compatibility.
- The ROADMAP Task 2.3 mentions `emailVerified` and NextAuth relations — these should be addressed in task 2.4 alongside the NextAuth models, since they depend on the Account/Session model definitions.
- Relations to models not yet defined (Recipe, UserRecipeTag, etc.) will cause `prisma validate` to fail until those models are added. This is expected.

**Patterns to follow**:

- Exact field definitions from [docs/CTO_SPECS.md](docs/CTO_SPECS.md) lines 346–360

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `prisma/schema.prisma` contains a `model User` block
- [ ] All fields match the CTO_SPECS.md locked schema exactly
- [ ] `username` field has `@unique` constraint
- [ ] `email` field has `@unique` constraint
- [ ] `id` field uses `@id @default(cuid())`
- [ ] `createdAt` uses `@default(now())`
- [ ] `updatedAt` uses `@updatedAt`
- [ ] All relation fields are declared (Recipe[], UserRecipeTag[], SavedRecipe[], Rating[], Comment[], RecipeShare[])

### Code Quality Checks

- [ ] Model definition exactly matches CTO_SPECS.md locked schema
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
- **Note for task 2.4**: The CTO_SPECS.md `User` model does not include `emailVerified`, `accounts`, or `sessions` fields. Task 2.4 (NextAuth Models) should evaluate whether these fields need to be added to the `User` model for NextAuth Prisma adapter compatibility and add them there.

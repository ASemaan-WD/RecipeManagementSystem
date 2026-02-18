---
task_id: 'task-2.7'
title: 'Define Tagging & Collection Models'
phase: 2
task_number: 7
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.3'
  - 'task-2.5'
blocks:
  - 'task-2.11'
  - 'task-2.13'
created_at: '2026-02-18'
---

# Define Tagging & Collection Models

## Current State

> Tasks 2.1–2.5 have defined the Prisma datasource, enums, `User`, and `Recipe` models. The `Recipe` model already declares relation stubs for `userTags UserRecipeTag[]` and `savedBy SavedRecipe[]`, and the `User` model declares `tags UserRecipeTag[]` and `savedRecipes SavedRecipe[]`. These target models need to be defined.

- **What exists**: `User` and `Recipe` models with relation stubs
- **What is missing**: `UserRecipeTag` and `SavedRecipe` models
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 456–498, `UserRecipeTag` and `SavedRecipe` models (locked schema)
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 6: Multi-Tag Support — `@@unique([userId, recipeId, status])`

---

## Desired Outcome

- **End state**: `UserRecipeTag` and `SavedRecipe` models are defined in `prisma/schema.prisma` exactly matching the CTO_SPECS.md locked schema, enabling multi-tag support and recipe saving.
- **User-facing changes**: None
- **Developer-facing changes**: Tagging and collection models in Prisma schema

---

## Scope & Boundaries

### In Scope

- Define `UserRecipeTag` model (lines 456–465)
- Define `SavedRecipe` model (lines 489–498)

### Out of Scope

- Defining sharing models `RecipeShare`, `ShareLink` (handled in task 2.8)
- Defining social models `Rating`, `Comment` (handled in task 2.9)
- API routes for tagging (Phase 6)
- UI components for tagging (Phase 6)

### Dependencies

- Task 2.3 (Define User Model) — `User` model is referenced
- Task 2.5 (Define Recipe Model) — `Recipe` model is referenced
- Task 2.2 (Define Enums) — `TagStatus` enum is referenced

---

## Implementation Details

### Section 1: UserRecipeTag Model

**What to do**: Define the `UserRecipeTag` model for per-user recipe status tags.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 456–465
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 6: "A user can apply multiple status tags to the same recipe simultaneously"

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `status`: TagStatus enum
- Unique constraint: `@@unique([userId, recipeId, status])` — allows multiple DIFFERENT statuses per user-recipe pair, prevents duplicate SAME status

**Key architectural note**: The `@@unique([userId, recipeId, status])` constraint is critical — it enables the multi-tag feature where a recipe can be simultaneously "Favorite" AND "Made Before" for the same user.

---

### Section 2: SavedRecipe Model

**What to do**: Define the `SavedRecipe` model for saving community/shared recipes to a user's collection.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 489–498

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `savedAt`: DateTime, `@default(now())`
- Unique constraint: `@@unique([userId, recipeId])` — one save per user-recipe pair

**Note**: ROADMAP Task 2.7 mentions a `createdAt` field, but CTO_SPECS.md uses `savedAt`. Follow CTO_SPECS.md.

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `UserRecipeTag` model exists with `status TagStatus` field
- [ ] `UserRecipeTag` has `@@unique([userId, recipeId, status])` constraint
- [ ] `UserRecipeTag` has `onDelete: Cascade` on recipe relation
- [ ] `SavedRecipe` model exists with `savedAt DateTime @default(now())`
- [ ] `SavedRecipe` has `@@unique([userId, recipeId])` constraint
- [ ] `SavedRecipe` has `onDelete: Cascade` on recipe relation

### Code Quality Checks

- [ ] Both models exactly match CTO_SPECS.md locked schema
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

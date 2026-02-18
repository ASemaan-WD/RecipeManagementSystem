---
task_id: 'task-2.11'
title: 'Add Database Indexes'
phase: 2
task_number: 11
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-2.5'
  - 'task-2.6'
  - 'task-2.7'
  - 'task-2.8'
  - 'task-2.9'
  - 'task-2.10'
blocks:
  - 'task-2.13'
created_at: '2026-02-18'
---

# Add Database Indexes

## Current State

> Tasks 2.1–2.10 have defined all models in the Prisma schema. Many models already include indexes as part of their CTO_SPECS.md definitions (e.g., `Recipe.@@index([authorId])`, `RecipeStep.@@index([recipeId])`, `ShareLink.@@index([token])`). ROADMAP Task 2.11 calls for adding additional performance-critical indexes and a composite index.

- **What exists**: Models with indexes already defined inline per CTO_SPECS.md: `Recipe` (authorId, visibility, cuisineType), `RecipeImage` (recipeId), `RecipeStep` (recipeId), `Comment` (recipeId), `ShareLink` (token), `ShoppingList` (userId)
- **What is missing**: Additional performance indexes listed in ROADMAP Task 2.11 that are NOT already in the CTO_SPECS.md locked schema, specifically composite indexes and indexes on join tables
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.11: lists all indexes to add
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Performance Considerations section

---

## Desired Outcome

- **End state**: All performance-critical indexes from ROADMAP Task 2.11 that are not already present in the schema are added. No duplicate indexes are created.
- **User-facing changes**: None
- **Developer-facing changes**: Additional database indexes for query performance

---

## Scope & Boundaries

### In Scope

- Audit existing indexes in the schema (already added by tasks 2.5–2.10)
- Add any MISSING indexes from the ROADMAP Task 2.11 list that are not already present:
  - `Recipe`: composite index on `[visibility, createdAt]` for community browsing
  - `Recipe`: indexes on `difficulty` and `avgRating` (if not already present)
  - `RecipeIngredient`: index on `ingredientId`
  - `UserRecipeTag`: index on `[userId, status]`
  - `SavedRecipe`: index on `userId`
  - `RecipeShare`: index on `userId`
  - `Rating`: index on `recipeId`

### Out of Scope

- Full-text search index (handled in task 2.14 — requires raw SQL migration)
- Removing or modifying existing indexes from CTO_SPECS.md
- Running migrations (handled in task 2.13)

### Dependencies

- Tasks 2.5–2.10 (all model definitions) must be complete

---

## Implementation Details

### Section 1: Audit Existing Indexes

**What to do**: Review all existing `@@index` and `@@unique` directives in the schema to avoid duplicates.

**Where to find context**:

- `prisma/schema.prisma` — scan all models for existing indexes

**Already present per CTO_SPECS.md**:

- `Recipe`: `@@index([authorId])`, `@@index([visibility])`, `@@index([cuisineType])`
- `RecipeImage`: `@@index([recipeId])`
- `RecipeStep`: `@@index([recipeId])`
- `Comment`: `@@index([recipeId])`
- `ShareLink`: `@@index([token])`
- `ShoppingList`: `@@index([userId])`

**Unique constraints that also serve as indexes**:

- `RecipeIngredient`: `@@unique([recipeId, ingredientId])`
- `RecipeDietaryTag`: `@@unique([recipeId, dietaryTagId])`
- `UserRecipeTag`: `@@unique([userId, recipeId, status])`
- `SavedRecipe`: `@@unique([userId, recipeId])`
- `RecipeShare`: `@@unique([recipeId, userId])`
- `Rating`: `@@unique([userId, recipeId])`

---

### Section 2: Add Missing Indexes

**What to do**: Add the following indexes that are listed in ROADMAP Task 2.11 but NOT already present in the schema.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.11
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Performance Considerations

**Indexes to add**:

1. `Recipe`: `@@index([visibility, createdAt])` — composite index for community browsing (sort by newest public recipes)
2. `Recipe`: `@@index([difficulty])` — filter by difficulty
3. `Recipe`: `@@index([avgRating])` — sort by rating
4. `RecipeIngredient`: `@@index([ingredientId])` — look up recipes by ingredient
5. `UserRecipeTag`: `@@index([userId, status])` — filter tags by user + status (collection tabs)
6. `SavedRecipe`: `@@index([userId])` — list user's saved recipes
7. `RecipeShare`: `@@index([userId])` — list recipes shared with a user
8. `Rating`: `@@index([recipeId])` — list ratings for a recipe

**Note**: Some of these may be partially covered by existing unique constraints (e.g., `SavedRecipe.@@unique([userId, recipeId])` creates an index starting with `userId`). However, PostgreSQL can use the leading column of a composite index for prefix queries, so `@@unique([userId, recipeId])` already covers `@@index([userId])`. Evaluate each and only add if not covered.

**Recommendations**:

- `SavedRecipe`: `@@unique([userId, recipeId])` already covers `userId` lookups — skip `@@index([userId])`
- `RecipeShare`: `@@unique([recipeId, userId])` covers `recipeId` lookups but NOT `userId` lookups — ADD `@@index([userId])`
- `Rating`: `@@unique([userId, recipeId])` covers `userId` lookups but NOT `recipeId` lookups — ADD `@@index([recipeId])`
- All other listed indexes should be added

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `Recipe` model has composite index `@@index([visibility, createdAt])`
- [ ] `RecipeIngredient` model has `@@index([ingredientId])`
- [ ] `UserRecipeTag` model has `@@index([userId, status])`
- [ ] `RecipeShare` model has `@@index([userId])`
- [ ] `Rating` model has `@@index([recipeId])`
- [ ] No duplicate indexes exist (each index serves a unique purpose)
- [ ] `npx prisma validate` runs without errors

### Code Quality Checks

- [ ] Each new index has a clear performance justification
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

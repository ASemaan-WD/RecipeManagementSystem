---
task_id: 'task-2.3'
title: 'Define Recipe & Related Models'
phase: 2
task_number: 3
status: 'done'
priority: 'high'
dependencies:
  - 'task-2.2'
blocks:
  - 'task-2.4'
  - 'task-2.5'
  - 'task-2.6'
created_at: '2026-02-18'
---

# Define Recipe & Related Models

## Current State

> Task 2.2 has defined enums, the `User` model, and NextAuth adapter models in `prisma/schema.prisma`. The `Recipe` model and all its related sub-models (images, ingredients, steps, dietary tags, tagging, sharing, social) have not been defined yet.

- **What exists**: `prisma/schema.prisma` with datasource, generator, enums, `User`, `Account`, `Session`, `VerificationToken` models
- **What is missing**: `Recipe`, `RecipeImage`, `Ingredient`, `RecipeIngredient`, `RecipeStep`, `DietaryTag`, `RecipeDietaryTag`, `UserRecipeTag`, `SavedRecipe`, `RecipeShare`, `ShareLink`, `Rating`, `Comment` models (13 models total)
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 362–524, all recipe and related model definitions (locked schema)
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 3: Three-Tier Visibility + Share Links
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 6: Multi-Tag Support
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 9: Social Features — Ratings & Comments

---

## Desired Outcome

- **End state**: All 13 recipe-related models are fully defined in `prisma/schema.prisma` with all fields, relations, unique constraints, and inline indexes exactly matching the CTO_SPECS.md locked schema. Together with the models from task 2.2, this completes the core schema (excluding shopping lists and additional performance indexes).
- **User-facing changes**: None
- **Developer-facing changes**: Full recipe domain model in Prisma schema — Recipe, images, ingredients, steps, dietary tags, user tags, saved recipes, shares, share links, ratings, comments

---

## Scope & Boundaries

### In Scope

- Define the `Recipe` model with all fields and relation declarations (CTO_SPECS.md lines 362–396)
- Define `RecipeImage` model (lines 398–408)
- Define `Ingredient` model (lines 410–414)
- Define `RecipeIngredient` model (lines 416–427)
- Define `RecipeStep` model (lines 429–438)
- Define `DietaryTag` model (lines 440–444)
- Define `RecipeDietaryTag` model (lines 446–454)
- Define `UserRecipeTag` model (lines 456–465)
- Define `SavedRecipe` model (lines 489–498)
- Define `RecipeShare` model (lines 467–476)
- Define `ShareLink` model (lines 478–487)
- Define `Rating` model (lines 500–511)
- Define `Comment` model (lines 513–524)
- All inline indexes defined within these models in CTO_SPECS.md

### Out of Scope

- Defining shopping list models (handled in task 2.4)
- Additional performance indexes beyond what's defined inline on each model (handled in task 2.5)
- Running migrations (handled in task 2.6)
- API routes or UI for any of these features (later phases)

### Dependencies

- Task 2.2 (Define Core Models & Enums) — `User` model and all enums must exist

---

## Implementation Details

### Section 1: Recipe Model

**What to do**: Add the `Recipe` model definition exactly as specified in CTO_SPECS.md.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 362–396, locked `Recipe` model

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String — NOTE: CTO_SPECS.md uses `name` (not `title` as mentioned in ROADMAP). Follow CTO_SPECS.md as the locked source.
- `description`: String, optional (`?`)
- `prepTime`: Int, optional (`?`) — in minutes
- `cookTime`: Int, optional (`?`) — in minutes
- `servings`: Int, optional (`?`)
- `difficulty`: Difficulty enum, optional (`?`)
- `cuisineType`: String, optional (`?`)
- `visibility`: Visibility enum, `@default(PRIVATE)`
- `nutritionData`: Json, optional (`?`) — cached AI nutrition estimates
- `avgRating`: Float, optional (`?`) — denormalized average rating
- `ratingCount`: Int, `@default(0)`
- `author`: User relation, `@relation("AuthoredRecipes", fields: [authorId], references: [id])`
- `authorId`: String
- Relations (array types):
  - `images RecipeImage[]`
  - `ingredients RecipeIngredient[]`
  - `steps RecipeStep[]`
  - `dietaryTags RecipeDietaryTag[]`
  - `userTags UserRecipeTag[]`
  - `shares RecipeShare[]`
  - `shareLinks ShareLink[]`
  - `savedBy SavedRecipe[]`
  - `ratings Rating[]`
  - `comments Comment[]`
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`
- Indexes: `@@index([authorId])`, `@@index([visibility])`, `@@index([cuisineType])`

**Important discrepancy note**: ROADMAP uses `title` for the recipe name field, but CTO_SPECS.md locked schema uses `name`. Follow CTO_SPECS.md.

---

### Section 2: RecipeImage Model

**What to do**: Define the `RecipeImage` model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 398–408

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `url`: String
- `source`: ImageSource enum
- `isPrimary`: Boolean, `@default(false)`
- `order`: Int, `@default(0)`
- Index: `@@index([recipeId])`

---

### Section 3: Ingredient and RecipeIngredient Models

**What to do**: Define the `Ingredient` global lookup table and the `RecipeIngredient` join model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 410–427

**Specific requirements**:

**Ingredient**:

- `id`: String, `@id @default(cuid())`
- `name`: String, `@unique`
- `recipes`: `RecipeIngredient[]` relation

**RecipeIngredient**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `ingredient`: Ingredient relation, `@relation(fields: [ingredientId], references: [id])`
- `ingredientId`: String
- `quantity`: String, optional — "2 cups", "1 tbsp" kept as string for flexibility
- `notes`: String, optional — "finely diced", "optional"
- `order`: Int, `@default(0)`
- Unique constraint: `@@unique([recipeId, ingredientId])`

**Important note**: ROADMAP mentions a `unit` field on RecipeIngredient, but CTO_SPECS.md locked schema does NOT include `unit`. Follow CTO_SPECS.md.

---

### Section 4: RecipeStep Model

**What to do**: Define the `RecipeStep` model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 429–438

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `stepNumber`: Int
- `instruction`: String
- `duration`: Int, optional — timer in minutes
- Index: `@@index([recipeId])`

---

### Section 5: DietaryTag and RecipeDietaryTag Models

**What to do**: Define the `DietaryTag` lookup table and the `RecipeDietaryTag` join model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 440–454

**Specific requirements**:

**DietaryTag**:

- `id`: String, `@id @default(cuid())`
- `name`: String, `@unique` — e.g., "vegan", "gluten-free", "dairy-free"
- `recipes`: `RecipeDietaryTag[]` relation

**RecipeDietaryTag**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `dietaryTag`: DietaryTag relation, `@relation(fields: [dietaryTagId], references: [id])`
- `dietaryTagId`: String
- Unique constraint: `@@unique([recipeId, dietaryTagId])`

---

### Section 6: UserRecipeTag and SavedRecipe Models

**What to do**: Define the tagging and collection models.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 456–465 and 489–498
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 6: Multi-Tag Support

**Specific requirements**:

**UserRecipeTag**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `status`: TagStatus enum
- Unique constraint: `@@unique([userId, recipeId, status])` — allows multiple DIFFERENT statuses per user-recipe pair, prevents duplicate SAME status

**SavedRecipe**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `savedAt`: DateTime, `@default(now())`
- Unique constraint: `@@unique([userId, recipeId])`

**Note**: ROADMAP mentions a `createdAt` field on SavedRecipe, but CTO_SPECS.md uses `savedAt`. Follow CTO_SPECS.md.

---

### Section 7: RecipeShare and ShareLink Models

**What to do**: Define the sharing models.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 467–487
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 3: Three-Tier Visibility + Share Links

**Specific requirements**:

**RecipeShare**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String — the user being shared WITH
- `sharedAt`: DateTime, `@default(now())`
- Unique constraint: `@@unique([recipeId, userId])`

**ShareLink**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `token`: String, `@unique @default(cuid())` — unique shareable token
- `isActive`: Boolean, `@default(true)` — author can revoke by setting to false
- `createdAt`: DateTime, `@default(now())`
- Index: `@@index([token])`

---

### Section 8: Rating and Comment Models

**What to do**: Define the social models.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 500–524
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 9: Social Features — Ratings & Comments

**Specific requirements**:

**Rating**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `value`: Int — 1-5 (validation enforced at application level, not schema level)
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`
- Unique constraint: `@@unique([userId, recipeId])` — one rating per user per recipe, upsert pattern

**Comment**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `content`: String
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`
- Index: `@@index([recipeId])` — for listing comments per recipe

**Note**: No nested replies — flat comment list per CTO Decision 9.

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `Recipe` model exists with all fields matching CTO_SPECS.md (uses `name`, not `title`)
- [ ] `Recipe` has `visibility @default(PRIVATE)` and `ratingCount @default(0)`
- [ ] `Recipe` has `@@index([authorId])`, `@@index([visibility])`, `@@index([cuisineType])`
- [ ] `RecipeImage` model exists with `source ImageSource` and `onDelete: Cascade`
- [ ] `Ingredient` model exists with `name @unique`
- [ ] `RecipeIngredient` has `@@unique([recipeId, ingredientId])` and `onDelete: Cascade`
- [ ] `RecipeStep` has `@@index([recipeId])` and `onDelete: Cascade`
- [ ] `DietaryTag` model exists with `name @unique`
- [ ] `RecipeDietaryTag` has `@@unique([recipeId, dietaryTagId])` and `onDelete: Cascade`
- [ ] `UserRecipeTag` has `@@unique([userId, recipeId, status])` — multi-tag support
- [ ] `SavedRecipe` has `@@unique([userId, recipeId])` and uses `savedAt`
- [ ] `RecipeShare` has `@@unique([recipeId, userId])` and `onDelete: Cascade`
- [ ] `ShareLink` has `token @unique`, `isActive @default(true)`, `@@index([token])`
- [ ] `Rating` has `@@unique([userId, recipeId])` and `onDelete: Cascade`
- [ ] `Comment` has `@@index([recipeId])` and `onDelete: Cascade`
- [ ] `npx prisma validate` runs without errors (all 13 models + User relations resolve)

### Code Quality Checks

- [ ] All models exactly match CTO_SPECS.md locked schema
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

- **Discrepancy**: ROADMAP uses `title` for the recipe name field; CTO_SPECS.md uses `name`. This task follows CTO_SPECS.md (`name`). All downstream tasks and API implementations should use `name` for consistency.
- **Discrepancy**: ROADMAP includes a `unit` field on `RecipeIngredient`. CTO_SPECS.md does not. If `unit` is needed later, it should be added via a separate schema migration.
- **Discrepancy**: ROADMAP mentions `createdAt` on `SavedRecipe`; CTO_SPECS.md uses `savedAt`. This task follows CTO_SPECS.md.
- **No new discoveries during execution** — all 13 models were added verbatim from CTO_SPECS.md with no issues.

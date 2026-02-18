---
task_id: 'task-2.6'
title: 'Define Recipe-Related Models'
phase: 2
task_number: 6
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.2'
  - 'task-2.5'
blocks:
  - 'task-2.11'
  - 'task-2.13'
created_at: '2026-02-18'
---

# Define Recipe-Related Models

## Current State

> Tasks 2.1–2.5 have defined the Prisma datasource, enums, `User`, and `Recipe` models. The recipe-related sub-models that represent images, ingredients, steps, and dietary tags have not been defined yet.

- **What exists**: `prisma/schema.prisma` with enums, `User`, and `Recipe` models. `Recipe` model already declares relation stubs for `images`, `ingredients`, `steps`, and `dietaryTags`.
- **What is missing**: `RecipeImage`, `Ingredient`, `RecipeIngredient`, `RecipeStep`, `DietaryTag`, and `RecipeDietaryTag` models
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 398–454, all six recipe-related models (locked schema)

---

## Desired Outcome

- **End state**: All six recipe-related models are defined in `prisma/schema.prisma` exactly matching the CTO_SPECS.md locked schema.
- **User-facing changes**: None
- **Developer-facing changes**: `RecipeImage`, `Ingredient`, `RecipeIngredient`, `RecipeStep`, `DietaryTag`, `RecipeDietaryTag` models defined with proper relations, constraints, and indexes

---

## Scope & Boundaries

### In Scope

- Define `RecipeImage` model (lines 398–408)
- Define `Ingredient` model (lines 410–414)
- Define `RecipeIngredient` model (lines 416–427)
- Define `RecipeStep` model (lines 429–438)
- Define `DietaryTag` model (lines 440–444)
- Define `RecipeDietaryTag` model (lines 446–454)
- All indexes defined within these models

### Out of Scope

- Defining tagging/collection models (handled in task 2.7)
- Defining sharing models (handled in task 2.8)
- Defining social models (handled in task 2.9)
- Additional cross-model indexes (handled in task 2.11)
- Running migrations (handled in task 2.13)

### Dependencies

- Task 2.2 (Define Enums) — `ImageSource` enum is referenced by `RecipeImage`
- Task 2.5 (Define Recipe Model) — `Recipe` model is referenced by all models here

---

## Implementation Details

### Section 1: RecipeImage Model

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

### Section 2: Ingredient Model

**What to do**: Define the `Ingredient` model (global ingredient lookup table).

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 410–414

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String, `@unique`
- `recipes`: `RecipeIngredient[]` relation

---

### Section 3: RecipeIngredient Model

**What to do**: Define the `RecipeIngredient` join model with extra data.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 416–427

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `ingredient`: Ingredient relation, `@relation(fields: [ingredientId], references: [id])`
- `ingredientId`: String
- `quantity`: String, optional — "2 cups", "1 tbsp" kept as string for flexibility
- `notes`: String, optional — "finely diced", "optional"
- `order`: Int, `@default(0)`
- Unique constraint: `@@unique([recipeId, ingredientId])`

**Important note**: ROADMAP Task 2.6 mentions a `unit` field on RecipeIngredient, but CTO_SPECS.md locked schema does NOT include `unit`. Follow CTO_SPECS.md — quantity strings include the unit (e.g., "2 cups").

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

### Section 5: DietaryTag Model

**What to do**: Define the `DietaryTag` model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 440–444

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String, `@unique` — e.g., "vegan", "gluten-free", "dairy-free"
- `recipes`: `RecipeDietaryTag[]` relation

---

### Section 6: RecipeDietaryTag Model

**What to do**: Define the `RecipeDietaryTag` join model.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 446–454

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `dietaryTag`: DietaryTag relation, `@relation(fields: [dietaryTagId], references: [id])`
- `dietaryTagId`: String
- Unique constraint: `@@unique([recipeId, dietaryTagId])`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `RecipeImage` model exists with `source` field using `ImageSource` enum
- [ ] `RecipeImage` has `onDelete: Cascade` on recipe relation
- [ ] `Ingredient` model exists with `name @unique`
- [ ] `RecipeIngredient` model exists with `@@unique([recipeId, ingredientId])`
- [ ] `RecipeIngredient` has `onDelete: Cascade` on recipe relation
- [ ] `RecipeStep` model exists with `stepNumber`, `instruction`, and optional `duration`
- [ ] `RecipeStep` has `onDelete: Cascade` on recipe relation
- [ ] `DietaryTag` model exists with `name @unique`
- [ ] `RecipeDietaryTag` model exists with `@@unique([recipeId, dietaryTagId])`
- [ ] `RecipeDietaryTag` has `onDelete: Cascade` on recipe relation
- [ ] All indexes specified in CTO_SPECS.md are present

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

- _(Empty until task execution begins)_
- **Discrepancy**: ROADMAP Task 2.6 includes a `unit` field on `RecipeIngredient`. CTO_SPECS.md does not. This task follows CTO_SPECS.md. If `unit` is needed later, it should be added via a separate schema update task.

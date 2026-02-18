---
task_id: 'task-2.5'
title: 'Define Recipe Model'
phase: 2
task_number: 5
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.2'
  - 'task-2.3'
blocks:
  - 'task-2.6'
  - 'task-2.7'
  - 'task-2.8'
  - 'task-2.9'
  - 'task-2.11'
created_at: '2026-02-18'
---

# Define Recipe Model

## Current State

> Tasks 2.1–2.3 have set up Prisma with enums and the `User` model. The `Recipe` model — the central entity of the application — has not been defined yet.

- **What exists**: `prisma/schema.prisma` with datasource, generator, enums, and `User` model
- **What is missing**: The `Recipe` model with all its fields and relation declarations
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 362–396, `Recipe` model definition (locked schema)

---

## Desired Outcome

- **End state**: The `Recipe` model is fully defined in `prisma/schema.prisma` with all fields, relation stubs, and indexes exactly matching the CTO_SPECS.md locked schema.
- **User-facing changes**: None
- **Developer-facing changes**: `Recipe` model definition with all fields and relation declarations

---

## Scope & Boundaries

### In Scope

- Define the `Recipe` model with ALL fields per CTO_SPECS.md lines 362–396
- Include all relation declarations (author, images, ingredients, steps, dietaryTags, userTags, shares, shareLinks, savedBy, ratings, comments)
- Include the three indexes defined on the `Recipe` model in CTO_SPECS.md: `@@index([authorId])`, `@@index([visibility])`, `@@index([cuisineType])`

### Out of Scope

- Defining related models like `RecipeImage`, `RecipeIngredient`, etc. (handled in task 2.6)
- Defining `UserRecipeTag`, `SavedRecipe` (handled in task 2.7)
- Defining `RecipeShare`, `ShareLink` (handled in task 2.8)
- Defining `Rating`, `Comment` (handled in task 2.9)
- Additional performance indexes beyond what's on the model itself (handled in task 2.11)
- Running migrations (handled in task 2.13)

### Dependencies

- Task 2.2 (Define Enums) — `Difficulty`, `Visibility` enums are referenced
- Task 2.3 (Define User Model) — `User` model is referenced via `author` relation

---

## Implementation Details

### Section 1: Add Recipe Model to schema.prisma

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
- Relations (array types — target models may not exist yet):
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

**Important discrepancy note**:

- ROADMAP Task 2.5 uses `title` for the recipe name field, but CTO_SPECS.md locked schema uses `name`. The CTO_SPECS.md is the locked/authoritative source — use `name`.
- ROADMAP Task 2.5 marks some fields as required, but CTO_SPECS.md marks them as optional (`?`). Follow CTO_SPECS.md.

**Patterns to follow**:

- Exact field definitions from [docs/CTO_SPECS.md](docs/CTO_SPECS.md) lines 362–396

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `prisma/schema.prisma` contains `model Recipe` block
- [ ] All fields match the CTO_SPECS.md locked schema exactly (field names, types, modifiers)
- [ ] `visibility` field defaults to `PRIVATE`
- [ ] `ratingCount` field defaults to `0`
- [ ] `author` relation uses `"AuthoredRecipes"` relation name
- [ ] Three `@@index` directives are present: `[authorId]`, `[visibility]`, `[cuisineType]`
- [ ] All 10 relation arrays are declared

### Code Quality Checks

- [ ] Model matches CTO_SPECS.md locked schema exactly
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
- **Discrepancy**: ROADMAP uses `title` for the recipe name field; CTO_SPECS.md uses `name`. This task follows CTO_SPECS.md (`name`). All downstream tasks and API implementations should use `name` for consistency.

---
task_id: 'task-2.10'
title: 'Define Shopping List Models'
phase: 2
task_number: 10
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-2.3'
blocks:
  - 'task-2.11'
  - 'task-2.13'
created_at: '2026-02-18'
---

# Define Shopping List Models

## Current State

> Tasks 2.1–2.9 have defined all core models (User, Recipe, and related models). The shopping list models — which are a Phase 10 feature but defined in the schema now — have not been added yet.

- **What exists**: Complete core schema with User, Recipe, and all related models
- **What is missing**: `ShoppingList` and `ShoppingListItem` models, and the `shoppingLists` relation on `User`
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.10: Define Shopping List Models
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 7b: Shopping List Generator, includes Prisma model definitions
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — The locked schema does NOT include shopping list models, but SENIOR_DEVELOPER.md explicitly defines them

---

## Desired Outcome

- **End state**: `ShoppingList` and `ShoppingListItem` models are defined in `prisma/schema.prisma`, and the `User` model has a `shoppingLists ShoppingList[]` relation.
- **User-facing changes**: None
- **Developer-facing changes**: Shopping list models in Prisma schema, User model updated with shopping list relation

---

## Scope & Boundaries

### In Scope

- Define `ShoppingList` model per SENIOR_DEVELOPER.md Phase 7b
- Define `ShoppingListItem` model per SENIOR_DEVELOPER.md Phase 7b
- Add `shoppingLists ShoppingList[]` relation to the `User` model
- Add `@@index([userId])` on `ShoppingList` per SENIOR_DEVELOPER.md

### Out of Scope

- Shopping list API routes (Phase 10)
- Shopping list UI components (Phase 10)
- Recipe-to-shopping-list ingredient aggregation logic (Phase 10)
- The optional `recipeId` reference on `ShoppingListItem` mentioned in ROADMAP but not in SENIOR_DEVELOPER.md

### Dependencies

- Task 2.3 (Define User Model) — `User` model is referenced and needs relation update

---

## Implementation Details

### Section 1: ShoppingList Model

**What to do**: Define the `ShoppingList` model.

**Where to find context**:

- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 7b, Shopping List Generator section
- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.10

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String — e.g., "Shopping list for week of Feb 17"
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `items`: `ShoppingListItem[]`
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`
- Index: `@@index([userId])`

---

### Section 2: ShoppingListItem Model

**What to do**: Define the `ShoppingListItem` model.

**Where to find context**:

- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 7b
- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.10

**Specific requirements** (following SENIOR_DEVELOPER.md):

- `id`: String, `@id @default(cuid())`
- `shoppingList`: ShoppingList relation, `@relation(fields: [shoppingListId], references: [id], onDelete: Cascade)`
- `shoppingListId`: String
- `ingredientName`: String
- `quantity`: String, optional — aggregated quantity
- `category`: String, optional — "produce", "dairy", "pantry", etc.
- `checked`: Boolean, `@default(false)`
- `order`: Int, `@default(0)`

**Note on discrepancy**: ROADMAP Task 2.10 includes additional fields (`unit`, `recipeId`) not present in SENIOR_DEVELOPER.md. Since SENIOR_DEVELOPER.md is the implementation-level locked spec and CTO_SPECS.md doesn't define these models at all, follow SENIOR_DEVELOPER.md as the authoritative source for these models.

---

### Section 3: Update User Model

**What to do**: Add the `shoppingLists` relation to the `User` model.

**Where to find context**:

- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 7b implies `User` has shopping lists

**Specific requirements**:

- Add `shoppingLists ShoppingList[]` to the `User` model

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `ShoppingList` model exists with `name`, `userId`, timestamps
- [ ] `ShoppingList` has `@@index([userId])`
- [ ] `ShoppingListItem` model exists with `ingredientName`, `quantity?`, `category?`, `checked`, `order`
- [ ] `ShoppingListItem` has `onDelete: Cascade` on shopping list relation
- [ ] `User` model includes `shoppingLists ShoppingList[]` relation

### Code Quality Checks

- [ ] Models follow SENIOR_DEVELOPER.md specification
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
- **Discrepancy**: ROADMAP Task 2.10 includes `unit` and `recipeId` fields on ShoppingListItem that are NOT in SENIOR_DEVELOPER.md. If needed during Phase 10 implementation, these can be added via a schema migration at that time.

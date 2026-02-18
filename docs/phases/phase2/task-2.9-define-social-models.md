---
task_id: 'task-2.9'
title: 'Define Social Models'
phase: 2
task_number: 9
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

# Define Social Models

## Current State

> Tasks 2.1–2.5 have defined the Prisma datasource, enums, `User`, and `Recipe` models. The `Recipe` model declares relation stubs for `ratings Rating[]` and `comments Comment[]`, and the `User` model declares `ratings Rating[]` and `comments Comment[]`. These target models need to be defined.

- **What exists**: `User` and `Recipe` models with social relation stubs
- **What is missing**: `Rating` and `Comment` models
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 500–524, `Rating` and `Comment` models (locked schema)
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 9: Social Features — Ratings & Comments

---

## Desired Outcome

- **End state**: `Rating` and `Comment` models are defined in `prisma/schema.prisma` exactly matching the CTO_SPECS.md locked schema.
- **User-facing changes**: None
- **Developer-facing changes**: Social models in Prisma schema enabling ratings and comments features

---

## Scope & Boundaries

### In Scope

- Define `Rating` model (lines 500–511)
- Define `Comment` model (lines 513–524)

### Out of Scope

- Defining shopping list models (handled in task 2.10)
- Rating/comment API routes (Phase 8)
- Rating/comment UI components (Phase 8)
- Rating recalculation logic (Phase 8)

### Dependencies

- Task 2.3 (Define User Model) — `User` model is referenced
- Task 2.5 (Define Recipe Model) — `Recipe` model is referenced

---

## Implementation Details

### Section 1: Rating Model

**What to do**: Define the `Rating` model for 1-5 star ratings.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 500–511
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 9: "One rating per user per recipe (upsert pattern)"

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `value`: Int — 1-5 (validation enforced at application level, not schema level)
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`
- Unique constraint: `@@unique([userId, recipeId])` — one rating per user per recipe, upsert pattern

---

### Section 2: Comment Model

**What to do**: Define the `Comment` model for recipe comments.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 513–524
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 9: "Standard CRUD with ownership checks, flat comment list"

**Specific requirements**:

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

- [ ] `Rating` model exists with `value Int` field
- [ ] `Rating` has `@@unique([userId, recipeId])` constraint (one rating per user per recipe)
- [ ] `Rating` has `onDelete: Cascade` on recipe relation
- [ ] `Rating` has both `createdAt` and `updatedAt` timestamps
- [ ] `Comment` model exists with `content String` field
- [ ] `Comment` has `@@index([recipeId])` for listing
- [ ] `Comment` has `onDelete: Cascade` on recipe relation
- [ ] `Comment` has both `createdAt` and `updatedAt` timestamps

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

---
task_id: 'task-2.8'
title: 'Define Sharing Models'
phase: 2
task_number: 8
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

# Define Sharing Models

## Current State

> Tasks 2.1–2.5 have defined the Prisma datasource, enums, `User`, and `Recipe` models. The `Recipe` model declares relation stubs for `shares RecipeShare[]` and `shareLinks ShareLink[]`, and the `User` model declares `sharedWithMe RecipeShare[]`. These target models need to be defined.

- **What exists**: `User` and `Recipe` models with sharing relation stubs
- **What is missing**: `RecipeShare` and `ShareLink` models
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 467–487, `RecipeShare` and `ShareLink` models (locked schema)
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 3: Three-Tier Visibility + Share Links

---

## Desired Outcome

- **End state**: `RecipeShare` and `ShareLink` models are defined in `prisma/schema.prisma` exactly matching the CTO_SPECS.md locked schema.
- **User-facing changes**: None
- **Developer-facing changes**: Sharing models in Prisma schema enabling share-by-username and share-by-link features

---

## Scope & Boundaries

### In Scope

- Define `RecipeShare` model (lines 467–476)
- Define `ShareLink` model (lines 478–487)

### Out of Scope

- Defining social models `Rating`, `Comment` (handled in task 2.9)
- Share link API routes (Phase 8)
- Share dialog UI (Phase 8)
- Generating actual share tokens at runtime

### Dependencies

- Task 2.3 (Define User Model) — `User` model is referenced
- Task 2.5 (Define Recipe Model) — `Recipe` model is referenced

---

## Implementation Details

### Section 1: RecipeShare Model

**What to do**: Define the `RecipeShare` model for user-to-user recipe sharing.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 467–476
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 3: "By username — Author searches for a registered user by username → creates a RecipeShare entry"

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `user`: User relation, `@relation(fields: [userId], references: [id])`
- `userId`: String — the user being shared WITH
- `sharedAt`: DateTime, `@default(now())`
- Unique constraint: `@@unique([recipeId, userId])` — a recipe can only be shared with a specific user once

---

### Section 2: ShareLink Model

**What to do**: Define the `ShareLink` model for token-based link sharing.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 478–487
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Decision 3: "By link — Author generates a share link → system creates a ShareLink with a unique token"

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `recipe`: Recipe relation, `@relation(fields: [recipeId], references: [id], onDelete: Cascade)`
- `recipeId`: String
- `token`: String, `@unique @default(cuid())` — unique shareable token
- `isActive`: Boolean, `@default(true)` — author can revoke by setting to false
- `createdAt`: DateTime, `@default(now())`
- Index: `@@index([token])` — for fast token lookups

**Note**: CTO_SPECS.md uses `@default(cuid())` for the token. ROADMAP Task 2.8 mentions using `nanoid` for cryptographically random tokens. The schema uses `cuid()` as the default — at runtime, the API route (Phase 8) may override this with `nanoid` for stronger randomness. The schema definition follows CTO_SPECS.md as-is.

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `RecipeShare` model exists with `sharedAt DateTime @default(now())`
- [ ] `RecipeShare` has `@@unique([recipeId, userId])` constraint
- [ ] `RecipeShare` has `onDelete: Cascade` on recipe relation
- [ ] `ShareLink` model exists with `token String @unique @default(cuid())`
- [ ] `ShareLink` has `isActive Boolean @default(true)`
- [ ] `ShareLink` has `onDelete: Cascade` on recipe relation
- [ ] `ShareLink` has `@@index([token])` for fast lookups

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

---
task_id: 'task-2.2'
title: 'Define Core Models & Enums'
phase: 2
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.1'
blocks:
  - 'task-2.3'
  - 'task-2.4'
created_at: '2026-02-18'
---

# Define Core Models & Enums

## Current State

> Task 2.1 has initialized Prisma with a `prisma/schema.prisma` file containing the datasource and generator blocks. No enums or models are defined yet.

- **What exists**: `prisma/schema.prisma` with datasource (PostgreSQL/Neon) and generator (prisma-client-js) configured
- **What is missing**: All four enums, the `User` model, and the NextAuth adapter models (`Account`, `Session`, `VerificationToken`)
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Database Schema (Locked)" section, lines 320–360, defines enums and `User` model
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Tasks 2.2, 2.3, 2.4 descriptions
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Username rules: alphanumeric + underscores, 3-20 chars, case-sensitive, unique
  - `package.json` — `@auth/prisma-adapter` (^2.11.1) is installed

---

## Desired Outcome

- **End state**: Four enums (`Difficulty`, `Visibility`, `TagStatus`, `ImageSource`), the `User` model, and the three NextAuth adapter models (`Account`, `Session`, `VerificationToken`) are all defined in `prisma/schema.prisma`. The `User` model includes both the CTO_SPECS.md fields and the NextAuth adapter fields (`emailVerified`, `accounts`, `sessions`).
- **User-facing changes**: None
- **Developer-facing changes**: Enum types and core identity models available in the Prisma schema for use in subsequent model definitions

---

## Scope & Boundaries

### In Scope

- Add the four enums to `prisma/schema.prisma`: `Difficulty`, `Visibility`, `TagStatus`, `ImageSource`
- Define the `User` model with all fields per CTO_SPECS.md, PLUS the NextAuth adapter fields (`emailVerified`, `accounts`, `sessions`)
- Define the `Account` model per Auth.js v5 Prisma adapter requirements
- Define the `Session` model per Auth.js v5 Prisma adapter requirements
- Define the `VerificationToken` model per Auth.js v5 Prisma adapter requirements

### Out of Scope

- Defining the `Recipe` or any recipe-related models (handled in task 2.3)
- Defining shopping list models (handled in task 2.4)
- Running migrations (handled in task 2.6)
- Configuring NextAuth.js v5 itself (handled in Phase 3)

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

**Patterns to follow**:

- Exact enum definitions from [docs/CTO_SPECS.md](docs/CTO_SPECS.md) lines 320–342

---

### Section 2: Add User Model to schema.prisma

**What to do**: Add the `User` model definition to `prisma/schema.prisma`.

**Where to find context**:

- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Lines 346–360, exact `User` model
- Auth.js v5 Prisma adapter documentation — additional fields needed

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `name`: String, optional (`?`)
- `email`: String, `@unique`
- `username`: String, optional (`?`), `@unique` — for share-by-username lookup
- `image`: String, optional (`?`)
- `emailVerified`: DateTime, optional (`?`) — required by NextAuth adapter
- `accounts`: `Account[]` — required by NextAuth adapter
- `sessions`: `Session[]` — required by NextAuth adapter
- `recipes`: `Recipe[]` relation with name `"AuthoredRecipes"`
- `tags`: `UserRecipeTag[]`
- `savedRecipes`: `SavedRecipe[]`
- `ratings`: `Rating[]`
- `comments`: `Comment[]`
- `sharedWithMe`: `RecipeShare[]`
- `createdAt`: DateTime, `@default(now())`
- `updatedAt`: DateTime, `@updatedAt`

**Important notes**:

- The CTO_SPECS.md locked schema does NOT include `emailVerified` or NextAuth-specific relations, but the Auth.js v5 Prisma adapter requires them. Add them to the `User` model here.
- Relations to models not yet defined (Recipe, UserRecipeTag, etc.) will cause `prisma validate` to fail until those models are added in task 2.3. This is expected.

---

### Section 3: Define Account Model

**What to do**: Create the `Account` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema: https://authjs.dev/getting-started/adapters/prisma

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `userId`: String (foreign key to User)
- `type`: String
- `provider`: String
- `providerAccountId`: String
- `refresh_token`: String? (text/db.Text if needed)
- `access_token`: String? (text/db.Text if needed)
- `expires_at`: Int?
- `token_type`: String?
- `scope`: String?
- `id_token`: String? (text/db.Text if needed)
- `session_state`: String?
- Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- Unique constraint: `@@unique([provider, providerAccountId])`
- Index on `userId`

---

### Section 4: Define Session Model

**What to do**: Create the `Session` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Session Strategy: JWT" — even though JWT sessions are used, the Session model may be needed by the adapter

**Specific requirements**:

- `id`: String, `@id @default(cuid())`
- `sessionToken`: String, `@unique`
- `userId`: String
- `expires`: DateTime
- Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- Index on `userId`

---

### Section 5: Define VerificationToken Model

**What to do**: Create the `VerificationToken` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema

**Specific requirements**:

- `identifier`: String
- `token`: String
- `expires`: DateTime
- Unique constraint: `@@unique([identifier, token])`
- NOTE: This model does NOT have an `id` field — it uses the composite unique as its identifier
- NOTE: This model has no relation to `User`

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
- [ ] `prisma/schema.prisma` contains `model User` with all CTO_SPECS.md fields plus `emailVerified`, `accounts`, `sessions`
- [ ] `username` field has `@unique` constraint
- [ ] `email` field has `@unique` constraint
- [ ] `prisma/schema.prisma` contains `model Account` with all required adapter fields
- [ ] `prisma/schema.prisma` contains `model Session` with all required adapter fields
- [ ] `prisma/schema.prisma` contains `model VerificationToken` with composite unique
- [ ] `Account` has `@@unique([provider, providerAccountId])`
- [ ] `Account` and `Session` have `onDelete: Cascade` on user relation

### Code Quality Checks

- [ ] Enum values exactly match the CTO_SPECS.md locked schema
- [ ] Models match Auth.js v5 Prisma adapter expectations
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

- **Auth.js v5 `@map`/`@@map` directives**: The official Auth.js v5 Prisma adapter docs use `@map`/`@@map` to map camelCase Prisma fields to snake_case DB columns (e.g., `userId` → `@map("user_id")`, `@@map("accounts")`). These were included per user direction that official docs always win over internal specs. Task 2.3 should decide whether to apply similar `@@map` conventions to the recipe-related models or keep them unmapped.
- **CTO_SPECS.md `User.email` vs Auth.js docs**: CTO_SPECS defines `email String @unique` (required), while the official Auth.js adapter schema defines `email String? @unique` (optional). We kept `email` as required per CTO_SPECS since the app requires email for authentication. Task 2.3+ should be aware of this difference.
- **`prisma validate` expected to fail**: The User model references `Recipe`, `UserRecipeTag`, `SavedRecipe`, `Rating`, `Comment`, `RecipeShare` — models not yet defined. `prisma validate` will fail until task 2.3/2.4 adds these models. `npm run build` passes since Next.js doesn't run Prisma validation during build.

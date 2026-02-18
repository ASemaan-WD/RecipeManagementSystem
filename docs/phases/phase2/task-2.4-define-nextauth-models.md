---
task_id: 'task-2.4'
title: 'Define NextAuth Models'
phase: 2
task_number: 4
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.3'
blocks:
  - 'task-2.13'
created_at: '2026-02-18'
---

# Define NextAuth Models

## Current State

> Task 2.3 has defined the `User` model in `prisma/schema.prisma`. The CTO_SPECS.md locked schema does NOT include NextAuth-specific models (`Account`, `Session`, `VerificationToken`) or the `emailVerified` field on `User`. However, ROADMAP Task 2.4 and the CTO_SPECS.md authentication section specify using the NextAuth.js v5 Prisma adapter, which requires specific models and fields.

- **What exists**: `User` model in `prisma/schema.prisma` per CTO_SPECS.md locked schema
- **What is missing**: `Account`, `Session`, `VerificationToken` models required by the NextAuth Prisma adapter, and any additional fields on `User` that the adapter expects (e.g., `emailVerified`, `accounts`, `sessions` relations)
- **Relevant code**:
  - `prisma/schema.prisma` — target file
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Authentication section: NextAuth.js v5, Prisma adapter, JWT session strategy
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.4 description
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 1 step 6: "Prisma adapter (auto-manages User, Account, Session tables)"
  - `package.json` — `@auth/prisma-adapter` (^2.11.1) is installed

---

## Desired Outcome

- **End state**: `Account`, `Session`, and `VerificationToken` models are defined in `prisma/schema.prisma` matching the Auth.js v5 Prisma adapter requirements. The `User` model is updated with `emailVerified`, `accounts`, and `sessions` relation fields as required by the adapter.
- **User-facing changes**: None
- **Developer-facing changes**: NextAuth adapter-compatible models in the Prisma schema, enabling NextAuth.js v5 configuration in Phase 3

---

## Scope & Boundaries

### In Scope

- Define the `Account` model per Auth.js v5 Prisma adapter schema requirements
- Define the `Session` model per Auth.js v5 Prisma adapter schema requirements (even though JWT sessions are used — the adapter may still reference it)
- Define the `VerificationToken` model per Auth.js v5 Prisma adapter schema requirements
- Add `emailVerified` field to the `User` model (DateTime, optional)
- Add `accounts Account[]` and `sessions Session[]` relation fields to the `User` model

### Out of Scope

- Configuring NextAuth.js v5 itself (handled in Phase 3, Task 3.1)
- Creating auth API routes (handled in Phase 3, Task 3.2)
- Defining any non-auth models
- Running migrations (handled in task 2.13)

### Dependencies

- Task 2.3 (Define User Model) must be complete

---

## Implementation Details

### Section 1: Add emailVerified and Auth Relations to User Model

**What to do**: Update the `User` model to include fields required by the NextAuth Prisma adapter.

**Where to find context**:

- Auth.js v5 Prisma adapter documentation — requires `emailVerified DateTime?` on `User`
- Auth.js v5 Prisma adapter documentation — requires `accounts Account[]` and `sessions Session[]` relations on `User`
- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.3 mentions these fields

**Specific requirements**:

- Add `emailVerified DateTime?` field to `User`
- Add `accounts Account[]` relation to `User`
- Add `sessions Session[]` relation to `User`
- Place these fields logically within the existing `User` model (after `image`, before `recipes`)

---

### Section 2: Define Account Model

**What to do**: Create the `Account` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema: https://authjs.dev/getting-started/adapters/prisma
- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.4: "Create Account model (OAuth provider data)"

**Specific requirements**:

- Fields required by Auth.js v5 adapter:
  - `id` String `@id @default(cuid())`
  - `userId` String (foreign key to User)
  - `type` String
  - `provider` String
  - `providerAccountId` String
  - `refresh_token` String? (text/db.Text if needed)
  - `access_token` String? (text/db.Text if needed)
  - `expires_at` Int?
  - `token_type` String?
  - `scope` String?
  - `id_token` String? (text/db.Text if needed)
  - `session_state` String?
- Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- Unique constraint: `@@unique([provider, providerAccountId])`
- Index on `userId`

---

### Section 3: Define Session Model

**What to do**: Create the `Session` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "Session Strategy: JWT" — even though JWT sessions are used, the Session model may be needed by the adapter

**Specific requirements**:

- Fields:
  - `id` String `@id @default(cuid())`
  - `sessionToken` String `@unique`
  - `userId` String
  - `expires` DateTime
- Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- Index on `userId`

---

### Section 4: Define VerificationToken Model

**What to do**: Create the `VerificationToken` model per Auth.js v5 Prisma adapter requirements.

**Where to find context**:

- Auth.js v5 official Prisma adapter schema

**Specific requirements**:

- Fields:
  - `identifier` String
  - `token` String
  - `expires` DateTime
- Unique constraint: `@@unique([identifier, token])`
- NOTE: This model does NOT have an `id` field — it uses the composite unique as its identifier
- NOTE: This model has no relation to `User`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `prisma/schema.prisma` contains `model Account` with all required adapter fields
- [ ] `prisma/schema.prisma` contains `model Session` with all required adapter fields
- [ ] `prisma/schema.prisma` contains `model VerificationToken` with composite unique
- [ ] `User` model includes `emailVerified DateTime?`
- [ ] `User` model includes `accounts Account[]` relation
- [ ] `User` model includes `sessions Session[]` relation
- [ ] `Account` model has `@@unique([provider, providerAccountId])`
- [ ] `Account` has `onDelete: Cascade` on user relation
- [ ] `Session` has `onDelete: Cascade` on user relation

### Code Quality Checks

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

- _(Empty until task execution begins)_
- **Note**: The executor should verify the exact field names and types against the current Auth.js v5 Prisma adapter documentation, as field naming conventions may have changed between versions. The Auth.js v5 adapter uses snake_case for OAuth token fields (`refresh_token`, `access_token`, `id_token`) to match the OAuth spec.

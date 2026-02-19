---
task_id: 'task-3.1'
title: 'Configure NextAuth.js v5 & Auth Routes'
phase: 3
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.8'
blocks:
  - 'task-3.2'
  - 'task-3.3'
  - 'task-3.4'
  - 'task-3.5'
created_at: '2026-02-19'
---

# Configure NextAuth.js v5 & Auth Routes

## Current State

> Phase 2 is complete. The database schema includes all NextAuth adapter models (User, Account, Session, VerificationToken) and the Prisma client singleton is configured. All dependencies are installed but no auth configuration exists yet.

- **What exists**:
  - `prisma/schema.prisma` — User (line 38), Account (line 60), Session (line 81), VerificationToken (line 93) models defined with NextAuth v5 adapter-compatible fields
  - `src/lib/db.ts` — Prisma client singleton using `@prisma/adapter-neon`
  - `package.json` — `next-auth@^5.0.0-beta.30` and `@auth/prisma-adapter@^2.11.1` installed (lines 34, 21)
  - `.env.example` — Auth env vars defined (NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET)
  - `.env.local` — Contains actual development values (git-ignored)
  - `src/app/api/` — Empty directory with `.gitkeep`
- **What is missing**:
  - `src/lib/auth.ts` — NextAuth v5 configuration (providers, adapter, callbacks, session strategy)
  - `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handlers
- **Relevant code**:
  - `src/lib/db.ts` — Prisma client import: `import { prisma } from '@/lib/db'`
  - `src/generated/prisma/client` — Generated Prisma types (custom output path per `prisma/schema.prisma` line 3)
  - `docs/CTO_SPECS.md` lines 64-70 — Auth tech stack decisions (NextAuth v5, JWT strategy, Google + GitHub OAuth)
  - `docs/SENIOR_DEVELOPER.md` lines 48-54 — NextAuth configuration requirements
  - `docs/SENIOR_DEVELOPER.md` lines 851-852 — File structure: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`

---

## Desired Outcome

- **End state**: NextAuth.js v5 is fully configured with Google and GitHub OAuth providers, Prisma adapter, and JWT session strategy. The auth API route handlers are created and OAuth flows work end-to-end (sign in, sign out, session retrieval). The JWT token and session include `userId` and `username` fields.
- **User-facing changes**: None directly — this is infrastructure. Users cannot yet sign in because the login page does not exist (task 3.3).
- **Developer-facing changes**:
  - `src/lib/auth.ts` — NextAuth v5 configuration exporting `handlers`, `auth`, `signIn`, `signOut`
  - `src/app/api/auth/[...nextauth]/route.ts` — GET and POST route handlers
  - Auth types extended to include `userId` and `username` in session and JWT

---

## Scope & Boundaries

### In Scope

- Create `src/lib/auth.ts` with full NextAuth v5 configuration
- Configure Google OAuth provider
- Configure GitHub OAuth provider
- Configure Prisma adapter for database persistence
- Configure JWT session strategy
- Implement `jwt` callback to attach `userId` and `username` to the token
- Implement `session` callback to expose `userId` and `username` on the session object
- Create `src/app/api/auth/[...nextauth]/route.ts` with GET and POST handlers
- Extend NextAuth TypeScript types for session and JWT (module augmentation)

### Out of Scope

- Auth middleware for route protection (task 3.2)
- Auth helper utilities like `requireAuth()`, `canViewRecipe()` (task 3.2)
- Login page UI (task 3.3)
- Username onboarding flow and API route (task 3.4)
- Root providers (SessionProvider, QueryProvider, ThemeProvider) (task 3.5)
- Redirect logic for users without usernames (task 3.4)
- Any tests (task 3.6)

### Dependencies

- Task 2.8 — Seed script and DB utilities complete (Phase 2 fully done)
- Valid OAuth credentials in `.env.local` for Google and GitHub
- Database accessible via `DATABASE_URL`

---

## Implementation Details

### Section 1: Create NextAuth v5 Configuration

**What to do**: Create `src/lib/auth.ts` with the complete NextAuth v5 setup.

**Where to find context**:

- `docs/CTO_SPECS.md` lines 64-70 — JWT session strategy, Google + GitHub providers
- `docs/SENIOR_DEVELOPER.md` lines 48-54 — NextAuth configuration requirements
- `docs/ROADMAP.md` lines 206-223 — Task 3.1 detailed requirements
- NextAuth.js v5 official documentation (Auth.js)

**Specific requirements**:

- Import `NextAuth` from `next-auth`
- Import `PrismaAdapter` from `@auth/prisma-adapter`
- Import `prisma` from `@/lib/db`
- Import Google and GitHub providers from `next-auth/providers/google` and `next-auth/providers/github`
- Configure the Prisma adapter: `adapter: PrismaAdapter(prisma)`
- Set session strategy to `jwt`: `session: { strategy: "jwt" }`
- Configure Google provider with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars
- Configure GitHub provider with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` env vars
- Implement `jwt` callback:
  - On initial sign-in (when `user` object is present): attach `user.id` as `token.userId` and `user.username` as `token.username`
  - On subsequent requests: pass through existing token values
- Implement `session` callback:
  - Copy `token.userId` to `session.user.id`
  - Copy `token.username` to `session.user.username`
- Export `handlers` (contains GET and POST), `auth`, `signIn`, `signOut` from the NextAuth call

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` lines 928-948 — Authorization middleware pattern (references `getServerSession(authOptions)` — adapt for NextAuth v5 which uses the exported `auth()` function instead)
- Prisma client import pattern from `src/lib/db.ts`: `import { prisma } from '@/lib/db'`

---

### Section 2: Create NextAuth API Route Handlers

**What to do**: Create the catch-all API route that handles all NextAuth requests (sign in, sign out, callbacks, CSRF).

**Where to find context**:

- `docs/ROADMAP.md` lines 217-219 — Route handler requirements

**Specific requirements**:

- Create directory `src/app/api/auth/[...nextauth]/`
- Create `route.ts` that imports `handlers` from `@/lib/auth`
- Re-export `handlers.GET` as `GET` and `handlers.POST` as `POST`
- This handles all OAuth callback URLs:
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/github`

**Patterns to follow**:

- Next.js App Router route handler pattern (named exports for HTTP methods)

---

### Section 3: Extend NextAuth TypeScript Types

**What to do**: Augment NextAuth module types so that `session.user.id` and `session.user.username` are typed throughout the application.

**Where to find context**:

- `docs/ROADMAP.md` lines 213-215 — JWT and session callback requirements
- `docs/SENIOR_DEVELOPER.md` lines 1013-1025 — Username is a `String?` on the User model (nullable until set)

**Specific requirements**:

- Use module augmentation (declare module) to extend `next-auth` types
- Extend the `Session` interface's `user` property to include:
  - `id: string`
  - `username: string | null`
- Extend the `JWT` interface to include:
  - `userId: string`
  - `username: string | null`
- Place the type augmentation either:
  - Inline in `src/lib/auth.ts`, OR
  - In a separate `src/types/next-auth.d.ts` file (if using a `.d.ts` file, ensure it's included in `tsconfig.json`)

**Patterns to follow**:

- NextAuth v5 official type augmentation pattern
- `tsconfig.json` already has `strict: true` and path aliases configured

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `src/lib/auth.ts` exports `handlers`, `auth`, `signIn`, `signOut`
- [ ] `src/app/api/auth/[...nextauth]/route.ts` exports `GET` and `POST`
- [ ] OAuth callback URLs are reachable (`/api/auth/callback/google`, `/api/auth/callback/github`)
- [ ] `auth()` returns a session object with `user.id` and `user.username` when authenticated
- [ ] JWT token includes `userId` and `username` fields
- [ ] Session callback correctly maps token fields to session.user
- [ ] Google OAuth provider is configured with correct env vars
- [ ] GitHub OAuth provider is configured with correct env vars
- [ ] Prisma adapter connects NextAuth to the database (User, Account, Session tables)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values — all secrets from environment variables
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] TypeScript types are properly augmented for session and JWT

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

- **Dual `@auth/core` versions**: `next-auth@5.0.0-beta.30` bundles `@auth/core@0.41.0` in its nested `node_modules`, while `@auth/prisma-adapter@2.11.1` depends on `@auth/core@0.41.1` at the top level. This means module augmentation of `next-auth/jwt` (which re-exports from `@auth/core/jwt`) does not affect the `JWT` type used internally by NextAuth's callback signatures (which resolve to the nested `@auth/core@0.41.0`). Type casts (`as string`, `as string | null`) are required in the `session` callback to bridge this gap. The augmentation still works correctly for consumer code that imports `Session` or `JWT` from `next-auth` or `next-auth/jwt`.
- **`user.username` not on `AdapterUser` type**: The Prisma adapter returns the full database row at runtime (including custom `username` field), but TypeScript types the `user` parameter in the `jwt` callback as `User | AdapterUser`, which does not include `username`. A cast via `unknown` is required: `(user as unknown as { username: string | null }).username`.
- **`NEXTAUTH_SECRET` vs `AUTH_SECRET`**: The `.env.example` uses `NEXTAUTH_SECRET`. NextAuth v5 reads both `NEXTAUTH_SECRET` and `AUTH_SECRET` automatically — no explicit `secret` config key is needed. Future tasks should consider standardizing on `AUTH_SECRET` (the v5 canonical name).
- **Type declaration placement**: `src/types/next-auth.d.ts` is automatically included by `tsconfig.json`'s `"include": ["**/*.ts"]` — no `tsconfig.json` modification was needed.

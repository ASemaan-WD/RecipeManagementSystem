---
task_id: 'task-3.2'
title: 'Create Auth Middleware & Helper Utilities'
phase: 3
task_number: 2
status: 'done'
priority: 'high'
dependencies:
  - 'task-3.1'
blocks:
  - 'task-3.3'
  - 'task-3.4'
  - 'task-3.5'
created_at: '2026-02-19'
---

# Create Auth Middleware & Helper Utilities

## Current State

> Task 3.1 has configured NextAuth.js v5 with Google and GitHub OAuth providers, Prisma adapter, JWT session strategy, and auth route handlers. The `auth()` function is available to retrieve the current session server-side. No route protection or auth helper utilities exist yet.

- **What exists**:
  - `src/lib/auth.ts` — NextAuth v5 configuration exporting `handlers`, `auth`, `signIn`, `signOut` (created in task 3.1)
  - `src/app/api/auth/[...nextauth]/route.ts` — Auth route handlers (created in task 3.1)
  - `prisma/schema.prisma` — Recipe model (line 102+) with `authorId` field, RecipeShare model, ShareLink model, Visibility enum
  - `src/lib/db.ts` — Prisma client singleton
- **What is missing**:
  - `middleware.ts` at project root — Route protection middleware
  - `src/lib/auth-utils.ts` — Helper functions (`getCurrentUser()`, `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()`)
- **Relevant code**:
  - `docs/SENIOR_DEVELOPER.md` lines 333-339 — Middleware route classification (protected, semi-protected, public)
  - `docs/SENIOR_DEVELOPER.md` lines 928-948 — Authorization middleware patterns (`requireAuth`, `requireRecipeOwner`, `canViewRecipe`)
  - `docs/ROADMAP.md` lines 226-237 — Task 3.2 detailed requirements
  - `docs/CTO_SPECS.md` lines 596-609 — Security considerations (ownership enforcement, visibility checks)

---

## Desired Outcome

- **End state**: A `middleware.ts` file at the project root protects routes by redirecting unauthenticated users. A `src/lib/auth-utils.ts` file provides reusable server-side helper functions for auth checks used across all API routes. Authenticated users without a username are redirected to `/onboarding`.
- **User-facing changes**: Unauthenticated users are redirected to `/login` when accessing protected routes. Authenticated users are redirected away from `/login` to `/dashboard`.
- **Developer-facing changes**:
  - `middleware.ts` — Route protection middleware at project root
  - `src/lib/auth-utils.ts` — `getCurrentUser()`, `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()` helpers

---

## Scope & Boundaries

### In Scope

- Create `middleware.ts` at the project root with route matchers
- Define protected routes (require auth)
- Define public routes (no auth required)
- Redirect unauthenticated users to `/login` for protected routes
- Redirect authenticated users away from `/login` to `/dashboard`
- Redirect authenticated users without a username to `/onboarding`
- Create `src/lib/auth-utils.ts` with helper functions:
  - `getCurrentUser()` — get the current authenticated user from the session
  - `requireAuth()` — throw/return error if not authenticated (for API routes)
  - `requireRecipeOwner(recipeId)` — verify the current user owns a specific recipe
  - `canViewRecipe(recipeId)` — check visibility access (owner, public, shared, valid share link)

### Out of Scope

- Login page UI (task 3.3)
- Onboarding page UI (task 3.4)
- Root providers (task 3.5)
- Testing auth middleware (task 3.6)
- Rate limiting (Phase 9)
- Comment moderation authorization (Phase 8)

### Dependencies

- Task 3.1 — NextAuth v5 configuration must be complete (`auth()` function available)
- Prisma schema with Recipe, RecipeShare, ShareLink models (completed in Phase 2)

---

## Implementation Details

### Section 1: Create Route Protection Middleware

**What to do**: Create `middleware.ts` at the project root that uses NextAuth v5's middleware integration to protect routes.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` lines 333-339 — Route classification
- `docs/ROADMAP.md` lines 228-231 — Protected and public route definitions
- NextAuth.js v5 middleware documentation

**Specific requirements**:

- Import `auth` from `@/lib/auth` (NextAuth v5 exports `auth` which can be used as middleware)
- Define protected route patterns that require authentication:
  - `/dashboard`
  - `/recipes/new`
  - `/recipes/*/edit`
  - `/my-recipes`
  - `/my-collection`
  - `/shopping-lists`
  - `/shopping-lists/*`
  - `/settings`
  - `/ai/*`
  - `/shared-with-me`
- Define public routes that never require auth:
  - `/`
  - `/login`
  - `/community`
  - `/api/auth/*`
- Redirect logic:
  - If unauthenticated and accessing a protected route → redirect to `/login`
  - If authenticated and accessing `/login` → redirect to `/dashboard`
  - If authenticated and no username set and NOT on `/onboarding` or `/api/auth/*` → redirect to `/onboarding`
  - If authenticated with username and on `/onboarding` → redirect to `/dashboard`
- Configure `matcher` in the middleware config to exclude static files, images, and `_next` assets
- The middleware must NOT block API routes (except for the redirect logic on page routes) — API auth is handled by `requireAuth()` in individual route handlers

**Patterns to follow**:

- NextAuth v5 middleware pattern (using `auth` as a wrapper or `withAuth`)
- `docs/SENIOR_DEVELOPER.md` line 895 — `middleware.ts` at project root

---

### Section 2: Create Auth Helper Utilities

**What to do**: Create `src/lib/auth-utils.ts` with reusable server-side authorization functions.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` lines 928-948 — Authorization middleware patterns
- `docs/ROADMAP.md` lines 232-237 — Helper function specifications
- `docs/CTO_SPECS.md` lines 599-600 — Ownership enforcement and visibility checks

**Specific requirements**:

1. **`getCurrentUser()`**:
   - Call `auth()` from `@/lib/auth` to get the session
   - Return the `session.user` object (with `id` and `username`) or `null` if not authenticated
   - This is a convenience wrapper for server components and API routes

2. **`requireAuth()`**:
   - Call `auth()` to get the session
   - If no session or no `session.user`, throw or return a `NextResponse` with 401 status and `{ error: "Unauthorized" }` body
   - Return the session (with typed `user.id` and `user.username`) if authenticated
   - Used in API route handlers

3. **`requireRecipeOwner(recipeId: string)`**:
   - Call `requireAuth()` to get the session (throws 401 if not authenticated)
   - Query the database for the recipe: `prisma.recipe.findUnique({ where: { id: recipeId } })`
   - If recipe not found → throw/return 404 with `{ error: "Recipe not found" }`
   - If `recipe.authorId !== session.user.id` → throw/return 403 with `{ error: "Forbidden" }`
   - Return both the session and the recipe on success

4. **`canViewRecipe(recipeId: string, shareToken?: string)`**:
   - Get current user (may be null for guests)
   - Query the recipe with its visibility
   - Access check chain (per `docs/CTO_SPECS.md` line 143):
     1. User is the recipe author → allow (return recipe)
     2. Recipe visibility is `PUBLIC` → allow (return recipe)
     3. User has a `RecipeShare` record for this recipe → allow (return recipe)
     4. A valid, active `ShareLink` token matches `shareToken` → allow (return recipe)
     5. Otherwise → throw/return 404 with `{ error: "Recipe not found" }` (intentionally 404, not 403, to avoid leaking existence)
   - Import `Visibility` enum from `@/generated/prisma/client`

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` lines 928-948 — The exact function signatures and error patterns
- Prisma client import: `import { prisma } from '@/lib/db'`
- Use the generated Prisma types from `@/generated/prisma/client`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `middleware.ts` exists at the project root
- [ ] Middleware redirects unauthenticated users from protected routes to `/login`
- [ ] Middleware redirects authenticated users from `/login` to `/dashboard`
- [ ] Middleware redirects authenticated users without username to `/onboarding`
- [ ] Middleware does NOT block public routes (`/`, `/community`, `/api/auth/*`)
- [ ] Middleware does NOT block static files and assets
- [ ] `getCurrentUser()` returns the user object when authenticated, null when not
- [ ] `requireAuth()` returns the session when authenticated, 401 response when not
- [ ] `requireRecipeOwner()` returns 401 for unauthenticated, 404 for missing recipe, 403 for non-owner, and recipe + session for valid owner
- [ ] `canViewRecipe()` correctly handles all five visibility check scenarios (owner, public, shared, share link, denied)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Error responses use 404 (not 403) for denied access to prevent existence leaking

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

- **JWT token freshness for `username`**: When a user completes onboarding (sets their username), the JWT token stored in the cookie still has `username: null` until the next sign-in or token refresh. The middleware's onboarding redirect (Rule 3) checks `req.auth?.user?.username`, so without a token refresh after onboarding, users could get stuck in a redirect loop. **Task 3.4 (onboarding page) must trigger a session/token update** after the username is set — either via `unstable_update()` from NextAuth v5 or by forcing a re-sign-in.
- **Prisma Edge Runtime warnings**: The build produces 3 warnings about Node.js modules (`node:path`, `node:url`, `node:buffer`) being loaded in Edge Runtime. These are pre-existing from the Prisma generated client import chain (`prisma/client.ts → db.ts → auth.ts`) and are not introduced by this task. The warnings are benign because the middleware only reads the JWT from the cookie — it does not invoke the Prisma adapter or execute database queries. The affected code paths are unreachable during middleware execution.

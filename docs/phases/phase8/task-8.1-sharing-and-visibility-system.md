---
task_id: 'task-8.1'
title: 'Sharing & Visibility System'
phase: 8
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-6.1'
blocks:
  - 'task-8.3'
  - 'task-8.4'
created_at: '2026-02-21'
---

# Sharing & Visibility System

## Current State

> The Prisma schema already defines `RecipeShare`, `ShareLink`, and `Visibility` enum (PRIVATE, SHARED, PUBLIC). The `canViewRecipe()` auth utility already implements the full four-step access check chain (author → PUBLIC → RecipeShare → ShareLink token). However, no API routes exist for managing visibility, sharing with users, or generating share links. No share dialog UI, user search API, or sharing React Query hooks exist.

- **What exists**:
  - `Visibility` enum (PRIVATE, SHARED, PUBLIC) in Prisma schema (`prisma/schema.prisma`)
  - `RecipeShare` model with `@@unique([recipeId, userId])` constraint (`prisma/schema.prisma`)
  - `ShareLink` model with unique `token`, `isActive` flag, and `@@index([token])` (`prisma/schema.prisma`)
  - `canViewRecipe(recipeId, shareToken?)` implementing full access check chain (`src/lib/auth-utils.ts`, lines 68-116)
  - `requireAuth()` and `requireRecipeOwner()` auth helpers (`src/lib/auth-utils.ts`, lines 25-57)
  - `User.username` field for share-by-username lookup (`prisma/schema.prisma`)
  - Recipe form tags-step allows setting visibility on create/edit (`src/components/recipes/recipe-form/tags-step.tsx`)
  - Middleware protects `/shared-with-me` route (`middleware.ts`, line 11)
  - Prisma client singleton (`src/lib/db.ts`)
- **What is missing**:
  - `src/app/api/recipes/[id]/visibility/route.ts` — PUT to change visibility
  - `src/app/api/recipes/[id]/shares/route.ts` — GET (list shares), POST (share by username), DELETE (revoke share)
  - `src/app/api/users/search/route.ts` — GET to search users by username prefix
  - `src/app/api/recipes/[id]/share-link/route.ts` — POST (generate share link), DELETE (revoke share link)
  - `src/components/social/share-dialog.tsx` — Share dialog UI with visibility selector, username search, share link management
  - `src/hooks/use-sharing.ts` — React Query hooks for sharing operations
  - Tests for all of the above
- **Relevant code**:
  - `prisma/schema.prisma` — RecipeShare, ShareLink, Visibility enum
  - `src/lib/auth-utils.ts` — canViewRecipe, requireAuth, requireRecipeOwner
  - `src/app/api/recipes/[id]/route.ts` — Pattern for recipe API routes with auth
  - `src/hooks/use-recipes.ts` — Pattern for React Query hooks with mutations
  - `src/hooks/use-tags.ts` — Pattern for optimistic mutation hooks
  - `docs/CTO_SPECS.md` (lines 544-558) — Sharing API contract
  - `docs/SENIOR_DEVELOPER.md` (lines 270-292) — Sharing implementation details

---

## Desired Outcome

- **End state**: A complete sharing system where recipe owners can set visibility (PRIVATE/SHARED/PUBLIC), share recipes with specific users by username, generate/revoke share links, and view who has access. A user search API supports the share dialog.
- **User-facing changes**: Recipe detail page gets a "Share" button that opens a dialog to manage visibility, share with users, and generate share links. Shared users can see the recipe in their collection.
- **Developer-facing changes**:
  - `src/app/api/recipes/[id]/visibility/route.ts` — Visibility management
  - `src/app/api/recipes/[id]/shares/route.ts` — User-to-user sharing CRUD
  - `src/app/api/users/search/route.ts` — Username search
  - `src/app/api/recipes/[id]/share-link/route.ts` — Share link management
  - `src/components/social/share-dialog.tsx` — Share dialog component
  - `src/hooks/use-sharing.ts` — Sharing React Query hooks
  - `src/lib/validations/sharing.ts` — Sharing Zod schemas
  - Tests for all new routes, components, and hooks

---

## Scope & Boundaries

### In Scope

- Create visibility update API route (PUT)
- Create share-by-username API routes (GET list, POST share, DELETE revoke)
- Create user search API route for share dialog
- Create share link API routes (POST generate, DELETE revoke)
- Create share dialog UI component with tabs (Users / Link)
- Create sharing React Query hooks with optimistic updates
- Create Zod validation schemas for sharing inputs
- Auto-set visibility to SHARED when sharing with a user from PRIVATE
- Write tests for all API routes, hooks, and the share dialog component

### Out of Scope

- Community page and public recipe browsing — task-8.3
- Guest access and summary-only views — task-8.3
- "Shared with me" page — task-8.3
- Ratings and comments — task-8.2
- Social integration into recipe detail page — task-8.4
- Notifications for shared recipes — explicitly deferred per `docs/CTO_SPECS.md` (lines 216-234)
- Share link access page (`/recipes/share/[token]/page.tsx`) — task-8.3

### Dependencies

- Recipe CRUD API routes functional (task-5.1 — done)
- Tag toggles and save button functional (task-6.1 — done)
- `canViewRecipe()` auth utility implemented (done: `src/lib/auth-utils.ts`)
- `RecipeShare` and `ShareLink` Prisma models defined and migrated (done)

---

## Implementation Details

### Section 1: Sharing Validation Schemas (`src/lib/validations/sharing.ts`)

**What to do**: Create Zod schemas for all sharing-related request validation.

**Where to find context**:

- `src/lib/validations/recipe.ts` — Existing validation schema pattern
- `docs/CTO_SPECS.md` (lines 544-558) — API contract

**Specific requirements**:

1. **`visibilitySchema`**: Validates `{ visibility: 'PRIVATE' | 'SHARED' | 'PUBLIC' }`
2. **`shareByUsernameSchema`**: Validates `{ username: string }` — the username to share with (3-20 chars, alphanumeric + underscores per `docs/SENIOR_DEVELOPER.md` line 1014)
3. **`userSearchSchema`**: Validates query param `q` — string, min 1 char, max 20 chars
4. Export inferred types for all schemas

**Patterns to follow**:

- Follow `src/lib/validations/recipe.ts` — Zod schemas with custom error messages

---

### Section 2: Visibility API Route (`src/app/api/recipes/[id]/visibility/route.ts`)

**What to do**: Create PUT endpoint to update recipe visibility.

**Where to find context**:

- `docs/CTO_SPECS.md` (line 547) — PUT `/api/recipes/[id]/visibility`
- `src/app/api/recipes/[id]/route.ts` — Existing route pattern with auth + ownership

**Specific requirements**:

1. **PUT** `/api/recipes/:id/visibility`:
   - Require authentication + recipe ownership via `requireRecipeOwner()`
   - Validate body against `visibilitySchema`
   - Update `recipe.visibility` in the database
   - Return updated recipe with new visibility
   - If changing from SHARED/PUBLIC to PRIVATE, existing shares and share links remain in the database but become inaccessible (the `canViewRecipe()` check already handles this correctly since PRIVATE recipes only show to the author)

**Patterns to follow**:

- Follow `src/app/api/recipes/[id]/route.ts` — auth guard, Zod safeParse, Prisma update, error handling

---

### Section 3: Share-by-Username API Routes (`src/app/api/recipes/[id]/shares/route.ts`)

**What to do**: Create GET, POST, DELETE endpoints for user-to-user sharing.

**Where to find context**:

- `docs/CTO_SPECS.md` (lines 548-550) — Share API contract
- `docs/SENIOR_DEVELOPER.md` (lines 275-279) — Share route details

**Specific requirements**:

1. **GET** `/api/recipes/:id/shares`:
   - Require authentication + recipe ownership
   - Return list of users this recipe is shared with
   - Include user fields: `id`, `username`, `name`, `image`, `sharedAt`
   - Do NOT include email (per `docs/CTO_SPECS.md` line 609)

2. **POST** `/api/recipes/:id/shares`:
   - Require authentication + recipe ownership
   - Validate body against `shareByUsernameSchema`
   - Look up target user by username (case-sensitive, per `docs/SENIOR_DEVELOPER.md` line 1016)
   - Return 404 if target user not found
   - Return 400 if trying to share with self
   - Return 409 if already shared with this user
   - Create `RecipeShare` record
   - If recipe visibility is PRIVATE, auto-update to SHARED
   - Return the created share record with user info

3. **DELETE** `/api/recipes/:id/shares`:
   - Require authentication + recipe ownership
   - Accept `{ userId: string }` in request body
   - Delete the `RecipeShare` record
   - Return 404 if share not found
   - Return success confirmation

**Patterns to follow**:

- Follow `src/app/api/recipes/[id]/tags/route.ts` — POST/DELETE pattern with auth + ownership

---

### Section 4: User Search API Route (`src/app/api/users/search/route.ts`)

**What to do**: Create GET endpoint for searching users by username prefix (for the share dialog).

**Where to find context**:

- `docs/CTO_SPECS.md` (line 558) — User search contract
- `docs/CTO_SPECS.md` (line 609) — No email leakage

**Specific requirements**:

1. **GET** `/api/users/search?q=...`:
   - Require authentication
   - Validate query param `q` against `userSearchSchema`
   - Search users by username prefix (case-sensitive `startsWith` per username rules)
   - Exclude the current user from results
   - Return limited fields only: `id`, `username`, `name`, `image` — NO email
   - Limit to 10 results
   - Order by username ascending

**Patterns to follow**:

- Simple GET route with auth, Zod validation on query params, lean Prisma select

---

### Section 5: Share Link API Routes (`src/app/api/recipes/[id]/share-link/route.ts`)

**What to do**: Create POST and DELETE endpoints for share link management.

**Where to find context**:

- `docs/CTO_SPECS.md` (lines 551-553) — Share link API contract
- `docs/CTO_SPECS.md` (lines 136-139) — Share link architecture

**Specific requirements**:

1. **POST** `/api/recipes/:id/share-link`:
   - Require authentication + recipe ownership
   - Generate a unique token using `nanoid` (21+ chars per `docs/ROADMAP.md` line 707) or `cuid()` (already default in Prisma)
   - Create `ShareLink` record with `isActive: true`
   - If recipe visibility is PRIVATE, auto-update to SHARED
   - Return the share link record with the full URL (construct using `NEXTAUTH_URL` or request host)

2. **DELETE** `/api/recipes/:id/share-link`:
   - Require authentication + recipe ownership
   - Accept `{ linkId: string }` in request body
   - Set `isActive = false` on the ShareLink record (soft revoke, per `docs/CTO_SPECS.md` line 137)
   - Return 404 if link not found or already inactive
   - Return success confirmation

**Patterns to follow**:

- Follow existing POST/DELETE patterns from `src/app/api/recipes/[id]/tags/route.ts`

---

### Section 6: Share Dialog Component (`src/components/social/share-dialog.tsx`)

**What to do**: Create the share dialog UI with visibility selector, username sharing, and link sharing.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 286-292) — Share dialog component spec
- `docs/ROADMAP.md` (lines 709-711) — Share dialog details
- `src/components/recipes/recipe-detail/recipe-actions.tsx` — Where the share button lives

**Specific requirements**:

1. **Dialog structure** (shadcn/ui Dialog):
   - Trigger: "Share" button on recipe detail page (integrate with `recipe-actions.tsx`)
   - Top section: Visibility selector (PRIVATE / SHARED / PUBLIC) — segmented control or radio group
   - Two tabs below (shadcn/ui Tabs): "Share with Users" | "Share Link"

2. **"Share with Users" tab**:
   - Username search input (debounced, calls `GET /api/users/search`)
   - Search results dropdown showing matching users (username, name, avatar)
   - Click to share → calls POST share endpoint
   - List of currently shared users with "Revoke" button per user
   - Empty state when no shares exist

3. **"Share Link" tab**:
   - "Generate Link" button → calls POST share-link endpoint
   - Display active share links with copy-to-clipboard button
   - "Revoke" button per link
   - Empty state when no links exist

4. **Props interface**: `{ recipeId: string; currentVisibility: Visibility; isOwner: boolean }`
   - Only shown when `isOwner` is true

**Patterns to follow**:

- Use shadcn/ui components: Dialog, Tabs, Button, Input, Avatar, Badge
- Follow `src/components/recipes/tag-toggles.tsx` — for optimistic UI patterns
- Use toast notifications for success/error feedback (sonner)

---

### Section 7: Sharing React Query Hooks (`src/hooks/use-sharing.ts`)

**What to do**: Create React Query hooks for all sharing operations.

**Where to find context**:

- `src/hooks/use-tags.ts` — Pattern for mutation hooks with optimistic updates
- `src/hooks/use-recipes.ts` — Pattern for query hooks with co-located fetchers

**Specific requirements**:

1. **`useRecipeShares(recipeId)`** — Query hook to fetch shared users for a recipe
2. **`useShareRecipe()`** — Mutation to share recipe with a user by username
3. **`useRevokeShare()`** — Mutation to revoke a user share
4. **`useRecipeShareLinks(recipeId)`** — Query hook to fetch active share links (derived from share data or separate)
5. **`useCreateShareLink()`** — Mutation to generate a share link
6. **`useRevokeShareLink()`** — Mutation to revoke a share link
7. **`useUpdateVisibility()`** — Mutation to change recipe visibility
8. **`useSearchUsers(query)`** — Query hook for user search (debounced by calling component)

- All mutations should invalidate relevant query keys on success
- Use toast notifications for success/error feedback
- Query keys: `['recipe-shares', recipeId]`, `['recipe-share-links', recipeId]`, `['user-search', query]`

**Patterns to follow**:

- Follow `src/hooks/use-tags.ts` — co-located fetchers, named exports, mutation callbacks

---

### Section 8: Tests

**What to do**: Write tests for all new API routes, the share dialog component, and hooks.

**Where to find context**:

- `src/app/api/recipes/[id]/tags/__tests__/route.test.ts` — API route test pattern
- `src/components/recipes/__tests__/tag-toggles.test.tsx` — Component test pattern
- `src/hooks/__tests__/use-recipes.test.ts` — Hook test pattern

**Specific requirements**:

**Visibility API Tests** (`src/app/api/recipes/[id]/visibility/__tests__/route.test.ts`):

- PUT with valid visibility → updates and returns recipe
- PUT with invalid visibility → 400
- PUT by non-owner → 403
- PUT unauthenticated → 401
- PUT changing PRIVATE → SHARED/PUBLIC and back

**Shares API Tests** (`src/app/api/recipes/[id]/shares/__tests__/route.test.ts`):

- GET returns list of shared users (without email)
- POST shares with valid username → creates RecipeShare
- POST with self → 400
- POST with non-existent username → 404
- POST duplicate share → 409
- POST on PRIVATE recipe → auto-updates visibility to SHARED
- DELETE removes share record
- All require auth + ownership

**User Search API Tests** (`src/app/api/users/search/__tests__/route.test.ts`):

- Returns matching users by username prefix
- Excludes current user
- Returns limited fields (no email leakage)
- Limits to 10 results
- Requires authentication

**Share Link API Tests** (`src/app/api/recipes/[id]/share-link/__tests__/route.test.ts`):

- POST generates link with unique token
- POST on PRIVATE recipe → auto-updates visibility to SHARED
- DELETE revokes link (soft delete, isActive = false)
- Require auth + ownership

**Share Dialog Component Tests** (`src/components/social/__tests__/share-dialog.test.tsx`):

- Renders visibility selector with current value
- Renders tabs for user sharing and link sharing
- User search input triggers debounced search
- Share and revoke buttons work

**Patterns to follow**:

- Use `vi.mock()` and `vi.hoisted()` for mocking Prisma and auth
- Co-located `__tests__/` directory pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] PUT `/api/recipes/:id/visibility` updates visibility for recipe owner
- [ ] POST `/api/recipes/:id/shares` creates a share with a valid username
- [ ] POST on PRIVATE recipe auto-sets visibility to SHARED
- [ ] Cannot share with self (400)
- [ ] Cannot share with non-existent user (404)
- [ ] Duplicate share returns 409
- [ ] GET `/api/recipes/:id/shares` returns shared users without email
- [ ] DELETE `/api/recipes/:id/shares` revokes a share
- [ ] GET `/api/users/search?q=...` returns matching users excluding self, no email
- [ ] POST `/api/recipes/:id/share-link` generates a unique token and returns full URL
- [ ] DELETE `/api/recipes/:id/share-link` soft-revokes the link
- [ ] Share dialog renders correctly with visibility selector and tabs
- [ ] All non-owner users receive 403 on sharing endpoints
- [ ] All unauthenticated users receive 401 on sharing endpoints
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] No email leakage in user search or share list responses
- [ ] Share link tokens are cryptographically unpredictable (cuid or nanoid)

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

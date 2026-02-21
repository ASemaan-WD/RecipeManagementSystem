---
task_id: 'task-8.3'
title: 'Community Page & Guest Access'
phase: 8
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-8.1'
  - 'task-7.2'
blocks:
  - 'task-8.4'
created_at: '2026-02-21'
---

# Community Page & Guest Access

## Current State

> The sharing and visibility system (task-8.1) provides the API infrastructure for three-tier visibility and sharing. The search UI (task-7.2) provides reusable search/filter components. However, no community browsing page, guest access handling, "Shared with me" page, or share link access page exists. The middleware protects `/shared-with-me` but the page itself does not exist. The existing recipe detail page does not handle guest access (summary-only view with login prompt).

- **What exists**:
  - Visibility system with PRIVATE/SHARED/PUBLIC support (task-8.1)
  - `canViewRecipe()` handles share link tokens (`src/lib/auth-utils.ts`)
  - Search UI components: SearchBar, FilterPanel, ActiveFilters (`src/components/search/`)
  - Recipe grid and card components (`src/components/recipes/recipe-grid.tsx`, `recipe-card.tsx`)
  - Recipe detail page (`src/app/(main)/recipes/[id]/page.tsx`)
  - Middleware with route protection (`middleware.ts`)
  - `RecipeShare` and `ShareLink` models fully defined in Prisma schema
  - Landing page at `/` (`src/app/page.tsx`) — currently shows for all users
  - `GET /api/search` returns public recipes for unauthenticated users (`src/app/api/search/route.ts`)
- **What is missing**:
  - `src/app/(main)/community/page.tsx` — Authenticated community browsing page
  - `src/app/community/page.tsx` — Public community page (no auth required) with summary-only cards
  - `src/app/(main)/shared-with-me/page.tsx` — Recipes shared with current user
  - `src/app/(main)/recipes/share/[token]/page.tsx` — Share link access page
  - `src/app/api/recipes/public/route.ts` — Public recipe list API (summary fields only)
  - `src/app/api/recipes/shared-with-me/route.ts` — Recipes shared with current user API
  - `src/app/api/share/[token]/route.ts` — Share link access API (full for auth, summary for guest)
  - Guest access handling in recipe detail page (summary-only with login prompt)
  - `src/components/shared/login-prompt.tsx` — Login prompt modal/overlay for guests
  - Tests for all of the above
- **Relevant code**:
  - `src/lib/auth-utils.ts` — canViewRecipe with share token support
  - `src/app/api/search/route.ts` — Pattern for public recipe queries
  - `src/components/search/` — Reusable search and filter components
  - `src/components/recipes/recipe-card.tsx` — Recipe card component
  - `src/components/recipes/recipe-grid.tsx` — Recipe grid component
  - `middleware.ts` — Route protection rules
  - `docs/CTO_SPECS.md` (lines 239-253) — Guest access rules
  - `docs/CTO_SPECS.md` (lines 536-538) — Public recipe API
  - `docs/SENIOR_DEVELOPER.md` (lines 322-349) — Guest access and community implementation

---

## Desired Outcome

- **End state**: A community page for browsing public recipes (authenticated version with full cards, guest version with summary-only cards). A "Shared with me" page listing recipes others have shared with the current user. A share link access page that shows full detail for authenticated users and a summary with login prompt for guests. Guest users can browse public recipe summaries but must log in to view full details.
- **User-facing changes**:
  - `/community` (public, no auth) — Browse public recipe summaries with login CTA
  - `/community` (authenticated) — Browse public recipes with full cards, search, and filters
  - `/shared-with-me` — See recipes shared by other users
  - `/recipes/share/[token]` — Access a recipe via share link
  - Recipe detail page shows summary-only with login prompt for guests
- **Developer-facing changes**:
  - `src/app/(main)/community/page.tsx` — Authenticated community page
  - `src/app/community/page.tsx` — Public community page
  - `src/app/(main)/shared-with-me/page.tsx` — Shared with me page
  - `src/app/(main)/recipes/share/[token]/page.tsx` — Share link access page
  - `src/app/api/recipes/public/route.ts` — Public recipe list API
  - `src/app/api/recipes/shared-with-me/route.ts` — Shared with me API
  - `src/app/api/share/[token]/route.ts` — Share link access API
  - `src/components/shared/login-prompt.tsx` — Login prompt component
  - Middleware updates for public community route
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create public community page with summary-only recipe cards (no auth required)
- Create authenticated community page with full recipe cards, search, and filters
- Create "Shared with me" page with recipe list showing who shared and when
- Create share link access page and API route
- Create public recipe list API returning summary fields only
- Create shared-with-me API returning recipes shared with current user
- Create login prompt component for guest users
- Handle guest access on recipe detail page (show summary with login CTA)
- Update middleware to allow public community route
- Write tests for all new pages, API routes, and components

### Out of Scope

- Ratings and comments UI on community/detail pages — task-8.4
- The sharing system itself (visibility, shares, share links) — task-8.1
- Star rating and comment components — task-8.2
- AI features — Phase 9
- SEO optimization / server-side rendering for public pages — Phase 12

### Dependencies

- Sharing and visibility system functional (task-8.1)
- Search UI components available (task-7.2)
- Recipe card and grid components exist (task-5.3 — done)
- `canViewRecipe()` handles all access check scenarios (done)
- Middleware exists and can be extended (done)

---

## Implementation Details

### Section 1: Public Recipe List API (`src/app/api/recipes/public/route.ts`)

**What to do**: Create GET endpoint that returns public recipes with summary-only fields (no auth required).

**Where to find context**:

- `docs/CTO_SPECS.md` (lines 535-536) — `GET /api/recipes/public`
- `docs/CTO_SPECS.md` (lines 239-251) — Guest access rules
- `src/app/api/search/route.ts` — Pattern for recipe list with filters and pagination

**Specific requirements**:

1. **GET** `/api/recipes/public`:
   - No authentication required
   - Return only `visibility: PUBLIC` recipes
   - **Summary fields only**: `id`, `name`, primary image URL, `prepTime`, `cookTime`, `difficulty`, `cuisineType`, `avgRating`, `ratingCount`, `createdAt`
   - Do NOT include: full ingredients, steps, comments, nutrition data, author email
   - Include author: `id`, `username`, `name`, `image` only
   - Support query params: `page`, `limit`, `sort` (newest, rating, prepTime), `cuisine`, `difficulty`
   - Return `PaginatedResponse` with pagination metadata
   - Default sort: newest first

**Patterns to follow**:

- Follow `src/app/api/search/route.ts` — pagination, filtering, lean Prisma select

---

### Section 2: Shared-with-Me API (`src/app/api/recipes/shared-with-me/route.ts`)

**What to do**: Create GET endpoint returning recipes shared with the current user.

**Where to find context**:

- `docs/CTO_SPECS.md` (line 537) — `GET /api/recipes/shared-with-me`
- `docs/SENIOR_DEVELOPER.md` (line 282) — Shared-with-me route

**Specific requirements**:

1. **GET** `/api/recipes/shared-with-me`:
   - Require authentication
   - Query `RecipeShare` records where `userId = currentUser.id`
   - Include recipe data with same fields as recipe list (full card data, not summary-only, since user has explicit access)
   - Include `sharedAt` timestamp from the `RecipeShare` record
   - Include recipe author info: `id`, `username`, `name`, `image`
   - Support pagination: `page`, `limit`
   - Sort by `sharedAt` descending (most recently shared first)
   - Return `PaginatedResponse`

**Patterns to follow**:

- Follow existing recipe list API patterns with auth

---

### Section 3: Share Link Access API (`src/app/api/share/[token]/route.ts`)

**What to do**: Create GET endpoint for accessing a recipe via share link token.

**Where to find context**:

- `docs/CTO_SPECS.md` (line 553) — `GET /api/share/[token]`
- `docs/CTO_SPECS.md` (lines 136-139) — Share link architecture

**Specific requirements**:

1. **GET** `/api/share/:token`:
   - No authentication required (works for both guests and authenticated users)
   - Look up `ShareLink` by token
   - Return 404 if token not found or `isActive = false`
   - Load the associated recipe
   - **If authenticated**: Return full recipe detail (all relations)
   - **If guest (unauthenticated)**: Return summary-only fields (same as public summary)
   - Include a `isAuthenticated` flag in the response so the frontend knows which view to render

**Patterns to follow**:

- Use `getCurrentUser()` for optional auth check
- Use lean Prisma select for summary vs full select for authenticated

---

### Section 4: Login Prompt Component (`src/components/shared/login-prompt.tsx`)

**What to do**: Create a reusable login prompt component for guest users.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 327-331) — Summary card and login prompt spec
- `docs/PRODUCT_MANAGER.md` (lines 83-86) — Guest access behavior

**Specific requirements**:

1. **Two variants**:
   - **Overlay**: Semi-transparent overlay on recipe detail page content, with "Log in to view full recipe" message and sign-in buttons
   - **Inline**: CTA card within a page layout (e.g., at the bottom of summary cards)
2. **Content**: Message explaining what they'll get access to (full ingredients, steps, comments, AI features)
3. **Actions**: "Sign in with Google" and "Sign in with GitHub" buttons, or a single "Log in" button linking to `/login`
4. **Props**: `{ variant: 'overlay' | 'inline'; message?: string }`

**Patterns to follow**:

- Use shadcn/ui Card and Button components
- Follow `src/components/shared/` — existing shared component patterns

---

### Section 5: Public Community Page (`src/app/community/page.tsx`)

**What to do**: Create a public community page accessible to guests with summary-only cards.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 322-349) — Community and guest access
- `docs/ROADMAP.md` (lines 741-748) — Community page specs

**Specific requirements**:

1. **Route**: `/community` (outside `(main)` layout group — no auth required)
2. **Layout**: Include a minimal header (app name, login CTA) and footer
3. **Content**:
   - Title: "Community Recipes" or "Discover Recipes"
   - Summary-only recipe cards in a grid (use existing `RecipeGrid` with summary card variant)
   - Each card shows: image, title, prep time, cuisine, difficulty, average rating
   - Click on a card → show login prompt (not navigate to detail page)
4. **Filtering**: Basic sort dropdown (Newest, Top Rated, Quick & Easy)
5. **Pagination**: Load more button
6. **Login CTA**: Prominent "Sign up to see full recipes" section

**Patterns to follow**:

- Follow `src/app/(main)/search/page.tsx` — grid layout with filters
- Use existing recipe card component with a `variant: 'summary'` prop or render limited data

---

### Section 6: Authenticated Community Page (`src/app/(main)/community/page.tsx`)

**What to do**: Create an authenticated community page with full recipe cards, search, and filters.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 343-348) — Community page spec
- `docs/ROADMAP.md` (lines 739-740) — Community page

**Specific requirements**:

1. **Route**: `/community` inside `(main)` layout group (authenticated)
2. **Content**:
   - Browse all public recipes with full card data
   - Reuse search bar and filter panel from `src/components/search/`
   - Sort options: Newest, Top Rated, Most Commented
   - Full recipe cards (click navigates to recipe detail page)
   - Save button and tag toggles on cards
3. **Data source**: Use existing `GET /api/search` with no `q` param and public visibility filter, or use `GET /api/recipes/public` with filters
4. **Empty state**: "No public recipes yet" with CTA to create and share

**Patterns to follow**:

- Follow `src/app/(main)/search/page.tsx` — reuse search/filter UI pattern

---

### Section 7: Shared-with-Me Page (`src/app/(main)/shared-with-me/page.tsx`)

**What to do**: Create a page showing recipes shared with the current user.

**Where to find context**:

- `docs/ROADMAP.md` (lines 747-748) — "Shared with me" page spec

**Specific requirements**:

1. **Route**: `/shared-with-me` (protected, already in middleware)
2. **Content**:
   - Recipe grid showing recipes shared via `RecipeShare`
   - Each card shows who shared it (author username + avatar) and when (`sharedAt`)
   - Full recipe cards (user has explicit view access)
   - Sort by most recently shared
3. **Empty state**: "No recipes have been shared with you yet"
4. **Data source**: `GET /api/recipes/shared-with-me`

**Patterns to follow**:

- Follow `src/app/(main)/my-collection/page.tsx` — grid with pagination

---

### Section 8: Share Link Access Page (`src/app/(main)/recipes/share/[token]/page.tsx`)

**What to do**: Create a page for accessing recipes via share link tokens.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 278-279) — Share link page
- `docs/CTO_SPECS.md` (lines 136-139) — Share link architecture

**Specific requirements**:

1. **Route**: `/recipes/share/[token]`
2. **Behavior**:
   - Fetch recipe via `GET /api/share/[token]`
   - **If authenticated**: Render full recipe detail (reuse recipe detail components)
   - **If guest**: Render summary with login prompt overlay
   - **If token invalid/revoked**: Show 404 page
3. **Note**: This page should work for both authenticated and unauthenticated users, so it should NOT be inside the `(main)` group (which requires auth). Place it at `src/app/recipes/share/[token]/page.tsx` outside the `(main)` group.

**Patterns to follow**:

- Follow `src/app/(main)/recipes/[id]/page.tsx` — recipe detail rendering
- Use conditional rendering based on auth state

---

### Section 9: Guest Access on Recipe Detail Page

**What to do**: Update the existing recipe detail page to handle guest access with summary-only view.

**Where to find context**:

- `docs/CTO_SPECS.md` (lines 239-253) — Guest access enforcement
- `docs/ROADMAP.md` (lines 744-746) — Guest vs authenticated rendering

**Specific requirements**:

1. When a guest navigates to `/recipes/[id]` for a PUBLIC recipe:
   - Show summary: title, primary image, metadata (prep time, cook time, difficulty, cuisine, rating)
   - Blur or hide: ingredients, steps, comments section
   - Show login prompt overlay with CTA
2. When a guest navigates to `/recipes/[id]` for a non-public recipe:
   - Show 404 (recipe not found) — do not leak existence
3. This may require accepting a `?token=` query parameter on the recipe detail page for share link access

**Patterns to follow**:

- Use `canViewRecipe()` for access check
- Use the login prompt component from Section 4
- Conditional rendering based on auth state

---

### Section 10: Middleware Updates

**What to do**: Update middleware to allow the public community route.

**Where to find context**:

- `middleware.ts` — Current route protection configuration

**Specific requirements**:

1. Ensure `/community` (the public version) is NOT in the protected routes list
2. Ensure `/recipes/share/[token]` is accessible without auth
3. The authenticated `/community` (inside `(main)` group) is handled by the `(main)` layout's own auth check, not middleware

---

### Section 11: Tests

**What to do**: Write tests for all new pages, API routes, and components.

**Where to find context**:

- `src/app/api/search/__tests__/route.test.ts` — API route test pattern
- `src/app/(main)/search/__tests__/page.test.tsx` — Page test pattern

**Specific requirements**:

**Public Recipe API Tests** (`src/app/api/recipes/public/__tests__/route.test.ts`):

- Returns only PUBLIC recipes
- Returns summary fields only (no ingredients, steps, comments)
- Does not require authentication
- Supports pagination and sorting

**Shared-with-Me API Tests** (`src/app/api/recipes/shared-with-me/__tests__/route.test.ts`):

- Returns recipes shared with current user
- Includes sharedAt timestamp
- Requires authentication
- Returns empty array when no shares exist

**Share Link API Tests** (`src/app/api/share/[token]/__tests__/route.test.ts`):

- Returns full detail for authenticated user
- Returns summary for guest
- Returns 404 for invalid token
- Returns 404 for revoked (inactive) token

**Page Tests**:

- Public community page renders summary cards
- Authenticated community page renders full cards with search
- Shared-with-me page renders shared recipes with sharer info
- Share link page renders full detail or login prompt based on auth

**Login Prompt Tests** (`src/components/shared/__tests__/login-prompt.test.tsx`):

- Renders overlay variant
- Renders inline variant
- Contains login action buttons

**Patterns to follow**:

- Co-located `__tests__/` directory pattern
- Use `vi.mock()` for mocking auth and API calls

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] GET `/api/recipes/public` returns only public recipes with summary fields
- [ ] GET `/api/recipes/shared-with-me` returns recipes shared with current user
- [ ] GET `/api/share/:token` returns full detail for auth, summary for guest
- [ ] GET `/api/share/:token` returns 404 for invalid/revoked token
- [ ] Public community page shows summary cards without requiring login
- [ ] Authenticated community page shows full cards with search and filters
- [ ] Shared-with-me page lists recipes shared by other users
- [ ] Share link page shows full detail or login prompt based on auth
- [ ] Guest viewing a public recipe sees summary with login CTA
- [ ] Guest viewing a private recipe sees 404
- [ ] Login prompt component renders correctly in both variants
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] No private recipe data leaked to guests
- [ ] No email leakage in any public or summary responses

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

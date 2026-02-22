---
task_id: 'task-12.1'
title: 'Database & API Optimization'
phase: 12
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-11.2'
blocks:
  - 'task-13.1'
created_at: '2026-02-22'
---

# Database & API Optimization

## Current State

> The application has ~31 API routes, full Prisma schema with 18+ models, and PostgreSQL full-text search. Most routes use precise `select` fields, but several optimization gaps exist.

- **What exists**:
  - Prisma client singleton with Neon serverless adapter: `src/lib/db.ts`
  - 31 API route files under `src/app/api/` with Zod validation and auth guards
  - In-memory sliding-window rate limiter at `src/lib/rate-limit.ts` — only wired to 4 AI routes
  - PostgreSQL full-text search with tsvector/GIN index (raw SQL migration)
  - React Query with global 30s `staleTime` default: `src/providers/query-provider.tsx`
  - Recipe list routes use precise `select` objects; some routes use broader `include`
- **What is missing**:
  - Rate limiting on non-AI API routes (recipe CRUD, comments, ratings, collections, shopping lists, search)
  - Cache headers on any API response
  - Request body size limits
  - Per-query-type `staleTime` tuning for React Query hooks
  - Optimization of sequential/duplicate DB queries in `canViewRecipe()` and recipe detail page
  - Deduplication of `RECIPE_DETAIL_SELECT` constant (duplicated in API route and page component)
- **Relevant code**:
  - `src/lib/rate-limit.ts` — existing rate limiter factory
  - `src/lib/auth-utils.ts` — `canViewRecipe()` with sequential DB calls (lines 68-116)
  - `src/app/api/recipes/[id]/route.ts` — `RECIPE_DETAIL_SELECT` constant
  - `src/app/(main)/recipes/[id]/page.tsx` — duplicated `RECIPE_DETAIL_SELECT`
  - `src/app/api/recipes/route.ts` — recipe creation with per-ingredient upsert loop
  - `src/providers/query-provider.tsx` — global `staleTime: 30 * 1000`
  - `src/hooks/use-recipes.ts`, `src/hooks/use-search.ts` — React Query hooks

---

## Desired Outcome

- **End state**: All API routes have appropriate rate limiting, cache headers, and request body size limits. Sequential DB queries are parallelized or deduplicated where possible. React Query hooks have per-query-type `staleTime` values. The `RECIPE_DETAIL_SELECT` constant is defined once and imported everywhere.
- **User-facing changes**: Faster page loads from cache headers and reduced DB round-trips. Rate limit protection against abuse on all endpoints.
- **Developer-facing changes**:
  - New general-purpose rate limiter instances for non-AI routes in `src/lib/rate-limit.ts`
  - A shared `src/lib/queries/recipe-select.ts` (or similar) exporting the `RECIPE_DETAIL_SELECT` constant
  - Updated React Query hooks with per-type `staleTime` values
  - Cache headers applied in API route responses
  - `next.config.ts` updated with `bodyParser` size limits (if applicable) or middleware-level Content-Length checks

---

## Scope & Boundaries

### In Scope

- Add rate limiting to all non-AI API routes (recipe CRUD, comments, ratings, tags, saves, collections, shopping lists, search, sharing, images) using the existing `createRateLimiter` factory
- Add `Cache-Control` headers to GET API responses (recipe list, recipe detail, search, collections, dietary tags, cuisines)
- Add request body size validation (reject bodies exceeding a reasonable threshold, e.g. 100KB for recipe creation, 10KB for comments)
- Optimize `canViewRecipe()` to reduce sequential DB queries where possible
- Deduplicate `RECIPE_DETAIL_SELECT` constant into a shared module
- Configure per-query-type `staleTime` in React Query hooks per docs/ROADMAP.md guidance:
  - Recipe list: 30s (current default, keep)
  - Recipe detail: 60s
  - Dietary tags: 5 minutes
  - Cuisine options: 5 minutes
  - Shopping lists: 30s (default)
  - Ratings/comments: 30s (default)
- Review and optimize the ingredient upsert loop in recipe create/update to batch where feasible
- Add tests for new rate limiting behavior and cache headers

### Out of Scope

- Redis/Upstash-based rate limiting (the in-memory approach is acceptable per `docs/ROADMAP.md` Appendix C — "sufficient for single-instance Vercel deployment")
- React Query `prefetchQuery` or `queryClient.prefetchInfiniteQuery` (that belongs to task 12.2 — Frontend Performance)
- Full-text search query performance optimization (already uses GIN index; further tuning only if measurable issues arise)
- Any UI changes
- Security hardening (task 12.3)

### Dependencies

- All Phase 11 tasks completed (testing infrastructure and E2E)
- All API routes from Phases 5-10 exist and are functional

---

## Implementation Details

### Section 1: Rate Limiting for Non-AI Routes

**What to do**: Create general-purpose rate limiter instances and apply them to all non-AI API routes.

**Where to find context**:

- `src/lib/rate-limit.ts` — existing `createRateLimiter` factory and `checkRateLimit` helper
- `docs/ROADMAP.md` Phase 12.1: "Implement rate limiting on all API routes (not just AI)"

**Specific requirements**:

- Create new rate limiter instances in `src/lib/rate-limit.ts`:
  - `apiWriteLimiter` — for mutation endpoints (POST/PUT/DELETE): 60 requests per 15 minutes per user
  - `apiReadLimiter` — for GET endpoints: 120 requests per 15 minutes per user
  - `searchLimiter` — for search endpoint: 60 requests per 15 minutes per user
- Apply `checkRateLimit()` at the top of each route handler, after auth check but before processing
- Return `429` with `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers (existing pattern)
- Unauthenticated GET routes (cuisines, dietary-tags, public search) should rate limit by IP or skip rate limiting (prefer skip — these are low-cost queries)

**Patterns to follow**:

- Follow the existing pattern in AI routes: call `checkRateLimit(limiter, userId)` and return early if non-null
- Per `docs/SENIOR_DEVELOPER.md`: keep rate limiting simple, in-memory is sufficient

---

### Section 2: Cache Headers on GET Responses

**What to do**: Add appropriate `Cache-Control` headers to all GET API responses.

**Where to find context**:

- `docs/ROADMAP.md` Phase 12.1: "Implement proper cache headers on API routes"

**Specific requirements**:

- **Public, rarely changing data** (dietary tags, cuisine options): `Cache-Control: public, max-age=300, stale-while-revalidate=600` (5 min cache)
- **User-specific, frequently changing data** (recipe list, collections, shopping lists): `Cache-Control: private, no-cache` (forces revalidation, allows conditional caching)
- **Recipe detail**: `Cache-Control: private, max-age=60, stale-while-revalidate=120`
- **Search results**: `Cache-Control: private, max-age=30, stale-while-revalidate=60`
- **Comment/rating lists**: `Cache-Control: private, no-cache`
- Apply headers via `NextResponse.json(data, { headers: { 'Cache-Control': '...' } })`

**Patterns to follow**:

- Use `private` for any response that varies by user authentication state
- Use `public` only for truly public, non-personalized data

---

### Section 3: Request Body Size Limits

**What to do**: Add Content-Length validation to mutation API routes to reject oversized payloads.

**Where to find context**:

- `docs/ROADMAP.md` Phase 12.1: "Add request size limits"

**Specific requirements**:

- Create a utility function `checkContentLength(request: Request, maxBytes: number): NextResponse | null` in `src/lib/api-utils.ts` (or extend `src/lib/auth-utils.ts`)
- Limits:
  - Recipe create/update: 100KB
  - Comment create/update: 10KB
  - Shopping list operations: 50KB
  - AI requests: 10KB
  - Default for all other mutations: 50KB
- Return `413 Payload Too Large` if `Content-Length` header exceeds the limit
- If `Content-Length` is missing, allow (Next.js/Vercel handles streaming; we can't always know size upfront)

**Patterns to follow**:

- Keep it simple — a single utility function called at the top of POST/PUT handlers, similar to `checkRateLimit`

---

### Section 4: Optimize canViewRecipe() and Deduplicate RECIPE_DETAIL_SELECT

**What to do**: Reduce duplicate and sequential database queries.

**Where to find context**:

- `src/lib/auth-utils.ts` lines 68-116 — `canViewRecipe()` makes 1-3 sequential queries
- `src/app/api/recipes/[id]/route.ts` — defines `RECIPE_DETAIL_SELECT`
- `src/app/(main)/recipes/[id]/page.tsx` — duplicates `RECIPE_DETAIL_SELECT`

**Specific requirements**:

- Extract `RECIPE_DETAIL_SELECT` into `src/lib/queries/recipe-select.ts` and import it in both the API route and the page component. Remove the duplicated definitions.
- In `canViewRecipe()`: the share check (step 3) and share-link check (step 4) are sequential but independent — combine them with `Promise.all` when both checks are needed (i.e., when the user is authenticated AND a share token is provided)
- In the recipe detail page (`src/app/(main)/recipes/[id]/page.tsx`): avoid re-fetching the recipe after `canViewRecipe()` already fetched it. Modify `canViewRecipe` to accept an optional `select` parameter, or restructure the page to use the recipe returned from the access check

**Patterns to follow**:

- Per `docs/SENIOR_DEVELOPER.md`: DRY principle, single source of truth for shared constants
- Per `docs/CTO_SPECS.md`: Prisma query-level optimization with strategic `select`/`include`

---

### Section 5: React Query staleTime Tuning

**What to do**: Configure per-query-type `staleTime` values in React Query hooks.

**Where to find context**:

- `src/providers/query-provider.tsx` — global default `staleTime: 30 * 1000`
- `src/hooks/use-recipes.ts`, `src/hooks/use-search.ts` — existing hooks
- `docs/ROADMAP.md` Phase 12.1: "Configure React Query staleTime per query type (recipe list 30s, detail 1min, dietary tags 5min)"

**Specific requirements**:

- Update hooks to set `staleTime` per query type:
  - `useRecipes()` (recipe list): 30s (inherits default — no change needed)
  - `useRecipe(id)` (recipe detail): 60_000 (60s)
  - `useCuisineOptions()`: 300_000 (5 min) — **already set, verify**
  - `useDietaryTags()`: 300_000 (5 min) — **already set, verify**
  - `useCollection()`: 30_000 (30s, default)
  - `useRatings()`: 30_000 (30s, default)
  - `useComments()`: 30_000 (30s, default)
  - `useShoppingLists()`: 30_000 (30s, default)
- Verify that the `nutritionLimiter` query already uses `Infinity` staleTime (confirmed in audit)

**Patterns to follow**:

- Set `staleTime` in individual `useQuery` options, not by overriding the global default

---

### Section 6: Optimize Ingredient Upsert Loop

**What to do**: Review and optimize the per-ingredient upsert loop in recipe create/update.

**Where to find context**:

- `src/app/api/recipes/route.ts` POST handler — iterates each ingredient with individual upsert + create
- `src/app/api/recipes/[id]/route.ts` PUT handler — similar pattern

**Specific requirements**:

- Pre-fetch existing ingredients by name in a single `findMany` query before the loop
- Use the pre-fetched results to determine which ingredients need creation vs. which already exist
- Use `createMany` for new ingredients where possible (note: `createMany` doesn't return created records in all Prisma versions — check compatibility)
- If batching is not feasible without significant complexity, document the current approach as acceptable for the expected ingredient count per recipe (typically 5-20)

**Patterns to follow**:

- Per `docs/CTO_SPECS.md`: optimize queries where measurable benefit exists, but don't over-engineer

---

### Section 7: Tests for New Optimizations

**What to do**: Add tests covering the new rate limiting, cache headers, and request size limits.

**Where to find context**:

- `src/lib/__tests__/rate-limit.test.ts` — existing rate limiter tests
- `docs/ROADMAP.md` Phase 12.1: general testing expectations

**Specific requirements**:

- Test new rate limiter instances (`apiWriteLimiter`, `apiReadLimiter`, `searchLimiter`) enforce limits correctly
- Test that `checkContentLength` returns 413 for oversized payloads and null for acceptable ones
- Test that GET API routes include appropriate `Cache-Control` headers in responses
- Test that mutation routes check rate limits (verify 429 when exceeded)

**Patterns to follow**:

- Follow existing test patterns in `src/lib/__tests__/rate-limit.test.ts`
- Per `.claude/test-file-skill.md`: co-located `__tests__/` directories, vi.mock for dependencies

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] All non-AI mutation API routes return 429 when rate limit is exceeded
- [ ] All GET API routes include appropriate `Cache-Control` headers
- [ ] Mutation routes return 413 for payloads exceeding the size limit
- [ ] `RECIPE_DETAIL_SELECT` is defined in one place and imported everywhere
- [ ] `canViewRecipe()` parallelizes independent share checks
- [ ] Recipe detail page does not fetch the recipe twice
- [ ] React Query hooks have correct per-type staleTime values
- [ ] New tests pass for rate limiting, cache headers, and content length validation

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
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

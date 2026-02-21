---
task_id: 'task-7.1'
title: 'Search API & Utilities'
phase: 7
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.7'
  - 'task-5.1'
blocks:
  - 'task-7.2'
created_at: '2026-02-21'
---

# Search API & Utilities

## Current State

> The PostgreSQL full-text search infrastructure is already set up: a `searchVector` tsvector column on the `Recipe` table with a GIN index and an auto-update trigger (migration `20260219004558`). The existing `GET /api/recipes` route uses basic `contains` (ILIKE) for search, not the tsvector column. No dedicated search API route, search utility library, or search hook exists.

- **What exists**:
  - `searchVector` tsvector column on `Recipe` table, auto-populated by trigger from `name` (weight A), `description` (weight B), `cuisineType` (weight C) — (`prisma/migrations/20260219004558_add_full_text_search/migration.sql`)
  - GIN index on `searchVector` column (`Recipe_searchVector_idx`)
  - `GET /api/recipes` with basic `contains` search on name/description and multi-filter support (cuisine, difficulty, maxPrepTime, maxCookTime, dietary, minRating, sort) — (`src/app/api/recipes/route.ts`)
  - `recipeFilterSchema` Zod schema with all filter params (`src/lib/validations/recipe.ts`, lines 110-139)
  - `RecipeFilters` type with `search`, `cuisine`, `difficulty`, `maxPrepTime`, `maxCookTime`, `dietary`, `minRating`, `sort` fields (`src/types/recipe.ts`, lines 100-112)
  - `useRecipes(filters)` hook that calls `GET /api/recipes` (`src/hooks/use-recipes.ts`)
  - Auth utilities: `getCurrentUser()` (`src/lib/auth-utils.ts`)
  - Prisma client singleton (`src/lib/db.ts`)
  - `PaginatedResponse<T>` type (`src/types/recipe.ts`, lines 114-122)
- **What is missing**:
  - `src/app/api/search/route.ts` — Dedicated search API route using full-text search
  - `src/lib/search.ts` — Search utility library (query builder, FTS conversion, sort builder)
  - `src/lib/validations/search.ts` — Search-specific Zod validation schema
  - `src/hooks/use-search.ts` — React Query hook for search with debounce
  - Tests for the search API route, utilities, and hook

- **Relevant code**:
  - `prisma/migrations/20260219004558_add_full_text_search/migration.sql` — FTS setup
  - `src/app/api/recipes/route.ts` — Pattern for GET route with filtering, pagination, and lean Prisma select
  - `src/lib/validations/recipe.ts` — Pattern for filter validation schema
  - `src/hooks/use-recipes.ts` — Pattern for query hooks
  - `src/types/recipe.ts` — `RecipeListItem`, `PaginatedResponse` types
  - `src/lib/db.ts` — Prisma client for raw queries

---

## Desired Outcome

- **End state**: A dedicated search API endpoint that uses PostgreSQL full-text search (tsvector/tsquery) for relevance-ranked results, combined with multi-filter support. A search utility library encapsulates FTS query building. A React Query hook provides debounced search with filter support.
- **User-facing changes**: None directly — the search API is functional but no search UI exists yet (task-7.2).
- **Developer-facing changes**:
  - `src/app/api/search/route.ts` — Search API route with FTS
  - `src/lib/search.ts` — Search utility functions
  - `src/lib/validations/search.ts` — Search validation schema
  - `src/hooks/use-search.ts` — React Query search hook with debounce
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create `src/lib/search.ts` with functions to build full-text search queries, filter clauses, and sort orders
- Create `src/lib/validations/search.ts` with a Zod schema for search query params
- Create `GET /api/search` API route that uses PostgreSQL full-text search with `ts_query` and `ts_rank`
- Create `src/hooks/use-search.ts` with a debounced search hook
- Add helper hooks: `useCuisineOptions()` and `useDietaryTags()` for populating filter dropdowns
- Write tests for the search API route, utility functions, and hooks

### Out of Scope

- Search UI components (search bar, filter panel, results page) — task-7.2
- Modifying the existing `GET /api/recipes` route — it continues to work with basic `contains` search
- Ingredient-based search (subquery through RecipeIngredient → Ingredient) — can be added as an enhancement later if needed
- Community page (Phase 8)
- Guest access restrictions on search results (Phase 8 — for now, guest search returns public recipe summaries)

### Dependencies

- Full-text search infrastructure deployed (task-2.7 — done: tsvector column, GIN index, trigger)
- Recipe CRUD API routes functional (task-5.1 — done)
- Recipes exist in the database with searchVector populated by the trigger

---

## Implementation Details

### Section 1: Search Utility Library (`src/lib/search.ts`)

**What to do**: Create utility functions that encapsulate the logic for building PostgreSQL full-text search queries and combining them with filter conditions.

**Where to find context**:

- `prisma/migrations/20260219004558_add_full_text_search/migration.sql` — tsvector setup, weights (A=name, B=description, C=cuisineType)
- `docs/ROADMAP.md` (lines 657-661) — Search utility specs
- `src/app/api/recipes/route.ts` (lines 37-89) — Existing Prisma where clause building pattern

**Specific requirements**:

1. **`sanitizeSearchQuery(query: string): string`**:
   - Remove special characters that could break tsquery: `!`, `&`, `|`, `(`, `)`, `:`, `*`, `'`, `"`
   - Trim whitespace
   - Collapse multiple spaces to single space
   - Return empty string if input is empty/whitespace-only after sanitization
   - Max length: truncate to 200 characters

2. **`buildTsQueryString(query: string): string`**:
   - Sanitize the input using `sanitizeSearchQuery()`
   - Split the sanitized query into words
   - Join with `&` for AND semantics (all words must match)
   - Append `:*` to the last word for prefix matching (partial word search)
   - Return the tsquery-compatible string
   - Handle edge cases: empty query returns empty string, single word, multiple words

3. **`buildSearchWhereClause(params: SearchFilterInput, userId?: string): object`**:
   - Build a Prisma `where` object combining FTS and filters
   - **Visibility**: If `userId`: show user's own recipes + public. If no userId: only public.
   - **Filters**: Apply same filter logic as `GET /api/recipes` — cuisine (case-insensitive equals), difficulty (enum), maxPrepTime (lte), maxCookTime (lte), dietary (tag IDs array), minRating (gte)
   - **FTS**: When `q` is provided and non-empty, the actual tsquery filtering is done via raw SQL (not in the Prisma where) — this function only builds the non-FTS filter portion
   - Return the Prisma where clause object

4. **`buildSearchOrderBy(sort: string, hasSearchQuery: boolean): object`**:
   - When `hasSearchQuery` is true and `sort` is `'relevance'`: return `null` (sort by relevance rank from raw SQL)
   - Otherwise map: `'newest'` → `{ createdAt: 'desc' }`, `'oldest'` → `{ createdAt: 'asc' }`, `'rating'` → `{ avgRating: { sort: 'desc', nulls: 'last' } }`, `'prepTime'` → `{ prepTime: { sort: 'asc', nulls: 'last' } }`, `'title'` → `{ name: 'asc' }`
   - Default: `{ createdAt: 'desc' }`

**Patterns to follow**:

- Export pure functions — no side effects, no database access
- Each function fully testable in isolation
- JSDoc documentation on each export

---

### Section 2: Search Validation Schema (`src/lib/validations/search.ts`)

**What to do**: Create a Zod schema for search query parameters.

**Where to find context**:

- `src/lib/validations/recipe.ts` — Existing `recipeFilterSchema` pattern
- `docs/ROADMAP.md` (lines 651-655) — Search query params

**Specific requirements**:

1. **`searchFilterSchema`**:
   - `q`: string, max 200 characters, optional (the full-text search query)
   - `cuisine`: string, optional
   - `difficulty`: enum (EASY, MEDIUM, HARD), optional
   - `maxPrepTime`: z.coerce.number(), positive int, optional
   - `maxCookTime`: z.coerce.number(), positive int, optional
   - `dietary`: union of string | string[], transform to array, optional
   - `minRating`: z.coerce.number(), min 1, max 5, optional
   - `sort`: enum (`'relevance'`, `'newest'`, `'oldest'`, `'rating'`, `'prepTime'`, `'title'`), default `'relevance'`
   - `page`: z.coerce.number(), positive int, default 1
   - `limit`: z.coerce.number(), int, min 1, max 50, default 12

2. Export inferred type: `SearchFilterInput`

**Patterns to follow**:

- Follow `src/lib/validations/recipe.ts` — string literal enums, `z.coerce.number()` for query params, transform for arrays

---

### Section 3: Search API Route (`src/app/api/search/route.ts`)

**What to do**: Create a dedicated search endpoint that leverages PostgreSQL full-text search for relevance-ranked results.

**Where to find context**:

- `docs/ROADMAP.md` (lines 651-656) — Search API specs
- `src/app/api/recipes/route.ts` — Existing GET route pattern with filters and pagination
- `prisma/migrations/20260219004558_add_full_text_search/migration.sql` — FTS column and index details

**Specific requirements**:

**GET `/api/search`** — Full-text search with filters:

1. **Parse and validate** query params against `searchFilterSchema`

2. **When `q` is provided (non-empty)**:
   - Use `prisma.$queryRaw` (Prisma raw SQL) to perform the full-text search
   - Build a SQL query that:
     - Applies `"searchVector" @@ to_tsquery('english', $1)` for full-text matching
     - Computes `ts_rank("searchVector", to_tsquery('english', $1))` as the relevance score
     - Applies all additional filter conditions (visibility, cuisine, difficulty, times, dietary, minRating)
     - Orders by relevance rank when `sort = 'relevance'`, otherwise by the specified sort field
     - Applies pagination (LIMIT/OFFSET)
   - Also run a count query for total matching results
   - Alternatively, use a **two-pass approach**:
     - Pass 1: Use raw SQL to get matching recipe IDs with relevance scores
     - Pass 2: Use Prisma `findMany` with `where: { id: { in: matchingIds } }` to get full data with relations
     - Re-sort the Prisma results to match the relevance ordering from the raw query
   - The two-pass approach is preferred because it allows reusing the existing lean Prisma `select` pattern for consistent response shapes

3. **When `q` is NOT provided (empty/missing)**:
   - Fall back to standard Prisma query with filters (same behavior as `GET /api/recipes` but without visibility-specific author filtering)
   - Only show public recipes for guests, own + public for authenticated users

4. **Visibility rules**:
   - Authenticated users: their own recipes + PUBLIC recipes
   - Unauthenticated users: PUBLIC recipes only
   - Note: shared recipes are NOT included in search results (sharing is done via direct links/usernames, not discovery)

5. **Response shape**: Same `PaginatedResponse<RecipeListItem>` as `GET /api/recipes`:
   - `data`: Array of `RecipeListItem` objects (author, primaryImage, dietaryTags, userTags, isSaved)
   - `pagination`: `{ total, page, pageSize, totalPages }`
   - Select fields: Same lean select as existing recipe list endpoint

6. **Error handling**:
   - 400 for invalid query params
   - Handle tsquery parse errors gracefully (fallback to empty results, not 500)

**Patterns to follow**:

- Use `prisma.$queryRaw` with tagged template literals for parameterized SQL (prevent SQL injection)
- Follow response transformation pattern from `src/app/api/recipes/route.ts` (lines 170-193)
- Use `getCurrentUser()` for optional auth (search works for both guests and authenticated users)

---

### Section 4: Search React Query Hook (`src/hooks/use-search.ts`)

**What to do**: Create React Query hooks for search and for populating filter option dropdowns.

**Where to find context**:

- `src/hooks/use-recipes.ts` — Existing hook pattern with co-located fetchers
- `docs/ROADMAP.md` (lines 662, 684) — Hook specs

**Specific requirements**:

1. **Fetcher function**: `fetchSearchResults(filters: SearchFilters)`:
   - GET `/api/search?q=...&cuisine=...&...`
   - Build URLSearchParams from the filters object
   - Returns `PaginatedResponse<RecipeListItem>`

2. **`SearchFilters` type** (separate from Zod schema — for the hook interface):
   - `q?: string`
   - `cuisine?: string`
   - `difficulty?: string`
   - `maxPrepTime?: number`
   - `maxCookTime?: number`
   - `dietary?: string[]`
   - `minRating?: number`
   - `sort?: string`
   - `page?: number`
   - `limit?: number`

3. **`useSearch(filters: SearchFilters)`** query hook:
   - Query key: `['search', filters]`
   - Calls `fetchSearchResults(filters)`
   - **Debounce**: The hook itself does NOT debounce — the `q` value should be debounced by the calling component before passing to the hook. This keeps the hook simple and composable.
   - `enabled`: Only run the query when at least one filter is active (not all empty/default) — specifically, enabled when `filters.q` is truthy OR at least one filter is set
   - `placeholderData`: Use `keepPreviousData` from TanStack Query to prevent layout shift during filter changes
   - `staleTime`: 30 seconds (search results can be slightly stale)

4. **`useDebouncedValue(value: string, delay?: number)`** utility hook:
   - Returns a debounced version of the string value
   - Default delay: 300ms
   - Exported from `use-search.ts` for use by the search bar component
   - Uses `useEffect` + `setTimeout` internally

5. **`useCuisineOptions()`** query hook:
   - Query key: `['cuisine-options']`
   - Fetches distinct cuisine types from `GET /api/recipes?limit=0` or a dedicated lightweight endpoint
   - Alternative: Use a simple `GET /api/search/cuisines` route that returns `prisma.recipe.findMany({ distinct: ['cuisineType'], select: { cuisineType: true }, where: { visibility: 'PUBLIC' } })`
   - `staleTime`: 5 minutes (cuisine types rarely change)
   - Returns: `string[]` of cuisine types

6. **`useDietaryTags()`** query hook:
   - Query key: `['dietary-tags']`
   - Fetches all dietary tags from `GET /api/search/dietary-tags` or reuse existing data
   - Route: `GET /api/search/dietary-tags` that returns `prisma.dietaryTag.findMany()`
   - `staleTime`: 5 minutes (dietary tags are seeded and rarely change)
   - Returns: `{ id: string; name: string }[]`

**Patterns to follow**:

- Follow `src/hooks/use-recipes.ts` — co-located fetchers, named exports, filters in query key
- Use `keepPreviousData` for smooth filter transitions
- Export all hooks as named exports

---

### Section 5: Supporting API Routes for Filter Options

**What to do**: Create lightweight API routes to populate filter option dropdowns.

**Where to find context**:

- `docs/ROADMAP.md` (line 684) — `useCuisineOptions()`, `useDietaryTags()`

**Specific requirements**:

1. **`GET /api/search/cuisines`** (`src/app/api/search/cuisines/route.ts`):
   - No authentication required
   - Return distinct `cuisineType` values from public recipes
   - Query: `prisma.recipe.findMany({ distinct: ['cuisineType'], select: { cuisineType: true }, where: { visibility: 'PUBLIC', cuisineType: { not: null } } })`
   - Return: `{ data: string[] }` (mapped from results)

2. **`GET /api/search/dietary-tags`** (`src/app/api/search/dietary-tags/route.ts`):
   - No authentication required
   - Return all dietary tags
   - Query: `prisma.dietaryTag.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })`
   - Return: `{ data: { id: string; name: string }[] }`

**Patterns to follow**:

- Simple GET routes with no auth required (public reference data)
- Use `NextResponse.json()` for responses

---

### Section 6: Tests

**What to do**: Write comprehensive tests for the search utility functions, API routes, and hooks.

**Where to find context**:

- `src/app/api/recipes/__tests__/route.test.ts` — API route test pattern
- `src/lib/validations/__tests__/recipe.test.ts` — Validation test pattern
- `src/hooks/__tests__/use-recipes.test.ts` — Hook test pattern

**Specific requirements**:

**Search Utility Tests** (`src/lib/__tests__/search.test.ts`):

- `sanitizeSearchQuery`: strips special characters, trims, collapses spaces, handles empty input, respects max length
- `buildTsQueryString`: single word, multiple words (AND joined), prefix matching (last word `:*`), empty input, special characters sanitized
- `buildSearchWhereClause`: with authenticated user (own + public), without user (public only), each filter individually, combined filters, no filters returns base visibility only
- `buildSearchOrderBy`: each sort option, relevance with search query returns null, default sort

**Validation Tests** (`src/lib/validations/__tests__/search.test.ts`):

- `searchFilterSchema`: valid params, defaults applied, invalid types rejected, max lengths enforced, dietary array transform

**API Route Tests** (`src/app/api/search/__tests__/route.test.ts`):

- GET with `q=chicken` — returns FTS-ranked results
- GET with `q` + filters — returns filtered FTS results
- GET without `q` — returns filter-only results
- GET with empty `q` — treated as no search query
- GET with special characters in `q` — sanitized, not 500
- GET unauthenticated — returns only public recipes
- GET authenticated — returns own + public recipes
- GET pagination — correct page, total, totalPages
- GET sort by relevance — highest-ranked first
- GET sort by rating — avgRating desc
- GET with non-existent cuisine filter — empty results, not error

**API Route Tests** (`src/app/api/search/cuisines/__tests__/route.test.ts`):

- Returns distinct cuisine types from public recipes
- Does not require authentication

**API Route Tests** (`src/app/api/search/dietary-tags/__tests__/route.test.ts`):

- Returns all dietary tags sorted by name
- Does not require authentication

**Hook Tests** (`src/hooks/__tests__/use-search.test.ts`):

- `useSearch`: sends correct query params, uses correct query key, enabled/disabled logic, keeps previous data
- `useDebouncedValue`: debounces value by specified delay, updates after timeout, resets on new value

**Patterns to follow**:

- Use `vi.mock()` and `vi.hoisted()` for mocking Prisma and auth
- Co-located `__tests__/` directory pattern
- For raw SQL tests: mock `prisma.$queryRaw` and verify the query structure
- For utility function tests: no mocking needed (pure functions)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] `GET /api/search?q=chicken` returns recipes matching "chicken" using full-text search
- [ ] Results are ranked by relevance when `sort=relevance` (name matches rank higher than description matches)
- [ ] `GET /api/search?q=chicken&cuisine=Italian` combines FTS with filter
- [ ] `GET /api/search?cuisine=Mexican` without `q` returns filter-only results
- [ ] `GET /api/search` with no params returns all public recipes (no search, no filters)
- [ ] Special characters in `q` are sanitized (no SQL injection, no 500 errors)
- [ ] Pagination works correctly with FTS results
- [ ] Unauthenticated search returns only public recipes
- [ ] Authenticated search returns own + public recipes
- [ ] `GET /api/search/cuisines` returns distinct cuisine types
- [ ] `GET /api/search/dietary-tags` returns all dietary tags
- [ ] `sanitizeSearchQuery()` handles edge cases (empty, special chars, long strings)
- [ ] `buildTsQueryString()` produces valid tsquery strings
- [ ] `useDebouncedValue()` debounces value changes by the specified delay
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Raw SQL uses parameterized queries (no string concatenation with user input)
- [ ] Search utility functions are pure and independently testable
- [ ] Zod validation prevents oversized or malformed query strings

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

---
task_id: 'task-6.2'
title: 'My Collection Page'
phase: 6
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-6.1'
blocks:
  - 'task-8.3'
created_at: '2026-02-21'
---

# My Collection Page

## Current State

> Task 6.1 is complete. Tag and save API routes are functional, `TagToggles` and `SaveButton` components exist, and React Query hooks with optimistic updates are implemented. There is no collection page or collection API route yet. The My Recipes page exists at `/my-recipes` and shows only the authenticated user's authored recipes with visibility tabs.

- **What exists**:
  - Tag API routes: `POST/DELETE /api/recipes/[id]/tags` (task-6.1)
  - Save API routes: `POST/DELETE /api/recipes/[id]/save` (task-6.1)
  - `TagToggles` and `SaveButton` components (task-6.1)
  - React Query hooks: `useToggleTag()`, `useToggleSave()` (`src/hooks/use-tags.ts`, task-6.1)
  - Existing My Recipes page at `/my-recipes` showing authored recipes (`src/app/(main)/my-recipes/page.tsx`)
  - Recipe grid component (`src/components/recipes/recipe-grid.tsx`) with Load More support
  - Recipe card component (`src/components/recipes/recipe-card.tsx`) with tag and save integration
  - `RecipeListItem` type with `userTags` and `isSaved` fields (`src/types/recipe.ts`)
  - `PaginatedResponse<T>` type (`src/types/recipe.ts`)
  - `RecipeFilters` type with pagination and sort (`src/types/recipe.ts`)
  - shadcn/ui `tabs` component installed (`src/components/ui/tabs.tsx`)
  - `useRecipes()` hook pattern with query key per filters (`src/hooks/use-recipes.ts`)
- **What is missing**:
  - `src/app/api/collections/route.ts` — GET endpoint for user's collection (tagged + saved recipes)
  - `src/app/(main)/my-collection/page.tsx` — My Collection page with tabbed filtering
  - `src/hooks/use-tags.ts` additions — `useCollection()` query hook
  - Tests for the collection API route, page, and hook

- **Relevant code**:
  - `src/app/(main)/my-recipes/page.tsx` — Pattern for recipe listing page with tabs
  - `src/components/recipes/recipe-grid.tsx` — Existing grid component to reuse
  - `src/hooks/use-recipes.ts` — Pattern for query hooks
  - `src/app/api/recipes/route.ts` — Pattern for GET route with filtering and pagination
  - `prisma/schema.prisma` — `UserRecipeTag` and `SavedRecipe` models
  - `src/components/layout/header.tsx` — Navigation links (will need "My Collection" link added)

---

## Desired Outcome

- **End state**: A My Collection page at `/my-collection` that displays all recipes the user has interacted with (tagged or saved), filterable by tab: All, Favorites, To Try, Made Before, Saved.
- **User-facing changes**:
  - New "My Collection" page accessible from the header navigation
  - Five tabs: All | Favorites | To Try | Made Before | Saved
  - Each tab shows a filtered recipe grid
  - Tab counts show how many recipes match each filter
  - URL-driven tab state (`/my-collection?tab=favorites`) for bookmarkable/shareable links
  - Sort options within each tab
  - Empty states per tab with relevant CTAs
- **Developer-facing changes**:
  - `src/app/api/collections/route.ts` — Collection API route
  - `src/app/(main)/my-collection/page.tsx` — My Collection page
  - `src/hooks/use-tags.ts` — `useCollection()` hook added
  - Navigation updated in header component
  - Tests for API route, page, and hook

---

## Scope & Boundaries

### In Scope

- Create `GET /api/collections` API route with tab filtering and pagination
- Create My Collection page with tabbed filtering UI
- Create `useCollection()` React Query hook
- Add "My Collection" navigation link to the header
- Write tests for the collection API route, page, and hook

### Out of Scope

- Modifying tag/save API routes (done in task-6.1)
- Modifying TagToggles or SaveButton components (done in task-6.1)
- Community page or public browsing (Phase 8 — task-8.3)
- Shared-with-me tab or page (Phase 8 — task-8.3)
- Shopping list features (Phase 10 — task-10.2)
- Modifying the My Recipes page (`/my-recipes`) — it remains for authored recipes only

### Dependencies

- Tag and save API routes functional (task-6.1 — done)
- Tag toggles and save button components exist (task-6.1 — done)
- React Query hooks for tags and saves exist (task-6.1 — done)

---

## Implementation Details

### Section 1: Collection API Route (`src/app/api/collections/route.ts`)

**What to do**: Create a GET endpoint that returns the user's collection — recipes they've tagged or saved.

**Where to find context**:

- `docs/ROADMAP.md` (lines 628-631) — Collection API spec
- `src/app/api/recipes/route.ts` — Pattern for paginated GET with filtering

**Specific requirements**:

**GET `/api/collections`** — Get user's collection:

- Require authentication via `requireAuth()`
- Accept query params: `tab`, `page`, `limit`, `sort`
- Validate query params with a Zod schema:
  - `tab`: enum `'all' | 'favorites' | 'to-try' | 'made-before' | 'saved'`, default `'all'`
  - `page`: positive int, default 1
  - `limit`: int, min 1, max 50, default 12
  - `sort`: enum `'newest' | 'oldest' | 'rating' | 'title'`, default `'newest'`

- **Tab filtering logic**:
  - `all`: Return recipes where user has ANY tag OR has saved the recipe (union of all tabs)
  - `favorites`: Return recipes where user has `UserRecipeTag` with `status = 'FAVORITE'`
  - `to-try`: Return recipes where user has `UserRecipeTag` with `status = 'TO_TRY'`
  - `made-before`: Return recipes where user has `UserRecipeTag` with `status = 'MADE_BEFORE'`
  - `saved`: Return recipes where user has a `SavedRecipe` record

- **Prisma query approach**:
  - For tag tabs: Query `Recipe` where `userTags: { some: { userId, status } }`
  - For saved tab: Query `Recipe` where `savedBy: { some: { userId } }`
  - For all tab: Query `Recipe` where `OR: [{ userTags: { some: { userId } } }, { savedBy: { some: { userId } } }]`

- **Response**:
  - Return `PaginatedResponse<RecipeListItem>` (same shape as `GET /api/recipes`)
  - Include `userTags` and `isSaved` for each recipe
  - Include tab counts in an additional `counts` field: `{ all, favorites, toTry, madeBefore, saved }`
  - Counts query: Run 5 parallel `prisma.recipe.count()` queries for each tab filter

- **Select fields**: Same lean select as `GET /api/recipes` (author, primary image, dietary tags, userTags, savedBy)

- **Sorting**: Same orderBy mapping as `GET /api/recipes` (newest, oldest, rating, title)

**Patterns to follow**:

- Follow `src/app/api/recipes/route.ts` for response shape, pagination, and select patterns
- Use `Promise.all()` for parallel count queries

---

### Section 2: Collection Validation Schema

**What to do**: Add the collection filter Zod schema to `src/lib/validations/tags.ts`.

**Where to find context**:

- `src/lib/validations/recipe.ts` — `recipeFilterSchema` pattern for query string parsing

**Specific requirements**:

1. **`collectionFilterSchema`**:
   - `tab`: z.enum(`'all'`, `'favorites'`, `'to-try'`, `'made-before'`, `'saved'`), default `'all'`
   - `page`: z.coerce.number(), positive int, default 1
   - `limit`: z.coerce.number(), int, min 1, max 50, default 12
   - `sort`: z.enum(`'newest'`, `'oldest'`, `'rating'`, `'title'`), default `'newest'`

2. Export inferred type: `CollectionFilterInput`

---

### Section 3: Collection Hook (`src/hooks/use-tags.ts` — addition)

**What to do**: Add a `useCollection()` query hook to the existing `use-tags.ts` file.

**Where to find context**:

- `src/hooks/use-recipes.ts` — Pattern for query hooks with filters as query key

**Specific requirements**:

1. **Fetcher function**: `fetchCollection(filters)` — GET to `/api/collections?tab=...&page=...&limit=...&sort=...`
   - Returns `PaginatedResponse<RecipeListItem> & { counts: CollectionCounts }`

2. **Type**: `CollectionCounts = { all: number; favorites: number; toTry: number; madeBefore: number; saved: number }`

3. **`useCollection(filters)`** query hook:
   - Query key: `['collection', filters]`
   - Calls `fetchCollection(filters)`

**Patterns to follow**:

- Follow `useRecipes()` in `src/hooks/use-recipes.ts` — filters object in query key, co-located fetcher

---

### Section 4: My Collection Page (`src/app/(main)/my-collection/page.tsx`)

**What to do**: Create the My Collection page with tabbed filtering.

**Where to find context**:

- `docs/ROADMAP.md` (lines 631-638) — My Collection page spec
- `src/app/(main)/my-recipes/page.tsx` — Existing tabbed recipe listing page pattern

**Specific requirements**:

1. **Page metadata**: Title "My Collection", description "Recipes you've tagged and saved"

2. **Tab navigation** using shadcn/ui `Tabs` component:
   - Tab values: `all`, `favorites`, `to-try`, `made-before`, `saved`
   - Tab labels with counts: "All (12)", "Favorites (5)", "To Try (3)", "Made Before (2)", "Saved (7)"
   - Default tab: `all`
   - Active tab driven by URL search param `?tab=` (use `useSearchParams()`)
   - Changing tabs updates the URL without navigation (use `router.push` or `router.replace`)

3. **Sort dropdown**: Above the grid, allow sorting by Newest, Oldest, Rating, Title

4. **Recipe grid**: Reuse `RecipeGrid` component from `src/components/recipes/recipe-grid.tsx`
   - Pass recipes from `useCollection()` hook
   - Show loading skeleton while fetching
   - Support "Load More" pagination

5. **Empty states** per tab:
   - All: "Your collection is empty. Browse the community to discover recipes!"
   - Favorites: "No favorites yet. Tap the heart icon on recipes you love."
   - To Try: "No recipes marked to try. Bookmark recipes you want to cook."
   - Made Before: "No recipes marked as made. Check off recipes you've cooked."
   - Saved: "No saved recipes. Save recipes from the community to your collection."
   - Each empty state should have a CTA button (e.g., "Browse Community" linking to `/community`, or "Browse Recipes" linking to `/search`)

6. **Responsive layout**:
   - Tabs scroll horizontally on mobile
   - Grid responsive: 1 col (mobile) → 2 (tablet) → 3 (desktop) → 4 (wide) — handled by `RecipeGrid`

7. **Authentication**: Page requires authentication. Redirect unauthenticated users (handled by middleware).

**Patterns to follow**:

- Follow `src/app/(main)/my-recipes/page.tsx` for page structure and tab patterns
- The page itself can be a client component wrapping the server-rendered layout
- Use `useSearchParams()` for URL-driven tab state
- Use `useRouter()` for tab navigation

---

### Section 5: Header Navigation Update

**What to do**: Add "My Collection" link to the header navigation.

**Where to find context**:

- `src/components/layout/header.tsx` — Header component with navigation links
- `src/components/layout/mobile-nav.tsx` — Mobile navigation component

**Specific requirements**:

1. Add "My Collection" link to the desktop header navigation, between "My Recipes" and "Shopping Lists" (or adjacent to "My Recipes")
2. Add "My Collection" link to the mobile navigation drawer
3. Use `Library` or `FolderHeart` icon from lucide-react for the nav item
4. Highlight the link when on `/my-collection` route (active state)

**Patterns to follow**:

- Follow existing navigation link patterns in `src/components/layout/header.tsx`

---

### Section 6: Tests

**What to do**: Write tests for the collection API route, page, and hook.

**Where to find context**:

- `src/app/api/recipes/__tests__/route.test.ts` — API route test pattern
- `src/app/(main)/my-recipes/__tests__/page.test.tsx` — Page test pattern (if exists)
- `src/hooks/__tests__/use-recipes.test.ts` — Hook test pattern

**Specific requirements**:

**API Route Tests** (`src/app/api/collections/__tests__/route.test.ts`):

- GET with `tab=all` — returns all tagged + saved recipes
- GET with `tab=favorites` — returns only favorited recipes
- GET with `tab=to-try` — returns only to-try recipes
- GET with `tab=made-before` — returns only made-before recipes
- GET with `tab=saved` — returns only saved recipes
- GET with pagination — returns correct page and total
- GET with sort — returns recipes in correct order
- GET includes `counts` object with correct values per tab
- GET unauthenticated — returns 401
- GET with no tags/saves — returns empty array with zero counts

**Page Tests** (`src/app/(main)/my-collection/__tests__/page.test.tsx`):

- Renders tab navigation with all five tabs
- Displays recipe grid with data from the hook
- Shows correct empty state per tab
- Tab selection updates URL search params
- Sort dropdown changes sort order
- Shows loading skeleton while fetching

**Patterns to follow**:

- Use `vi.mock()` and `vi.hoisted()` for mocking
- Co-located `__tests__/` directory pattern
- Follow existing test patterns from Phase 5

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] `GET /api/collections?tab=all` returns all tagged and saved recipes for the authenticated user
- [ ] `GET /api/collections?tab=favorites` returns only recipes tagged as FAVORITE
- [ ] `GET /api/collections?tab=to-try` returns only recipes tagged as TO_TRY
- [ ] `GET /api/collections?tab=made-before` returns only recipes tagged as MADE_BEFORE
- [ ] `GET /api/collections?tab=saved` returns only saved recipes
- [ ] Response includes `counts` object with accurate per-tab counts
- [ ] Pagination works correctly across all tabs
- [ ] Sort options (newest, oldest, rating, title) produce correct ordering
- [ ] My Collection page renders with five tabs
- [ ] Tab counts update when tags/saves change
- [ ] Tab state persists in URL (`?tab=favorites`)
- [ ] Empty states display correct messaging and CTAs per tab
- [ ] "My Collection" link appears in header navigation (desktop and mobile)
- [ ] Active tab highlights in navigation
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Reuses existing components (`RecipeGrid`, `RecipeCard`, `Tabs`)
- [ ] Collection API reuses the same `RecipeListItem` response shape as `GET /api/recipes`

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

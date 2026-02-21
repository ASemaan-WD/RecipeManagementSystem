---
task_id: 'task-7.2'
title: 'Search UI & Results Page'
phase: 7
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-7.1'
  - 'task-5.3'
  - 'task-6.1'
blocks:
  - 'task-8.3'
created_at: '2026-02-21'
---

# Search UI & Results Page

## Current State

> Task 7.1 is complete. The search API (`GET /api/search`) is functional with PostgreSQL full-text search, multi-filter support, and pagination. React Query hooks (`useSearch`, `useDebouncedValue`, `useCuisineOptions`, `useDietaryTags`) exist. Supporting endpoints for cuisine options and dietary tags are live. The header contains a placeholder search area but no interactive search bar. No search page, filter panel, or search bar component exists.

- **What exists**:
  - `GET /api/search` — Full-text search API route with FTS + filters + pagination (task-7.1)
  - `GET /api/search/cuisines` — Distinct cuisine types endpoint (task-7.1)
  - `GET /api/search/dietary-tags` — Dietary tags endpoint (task-7.1)
  - `src/lib/search.ts` — Search utility functions (task-7.1)
  - `src/lib/validations/search.ts` — `searchFilterSchema` with `SearchFilterInput` type (task-7.1)
  - `src/hooks/use-search.ts` — `useSearch()`, `useDebouncedValue()`, `useCuisineOptions()`, `useDietaryTags()` hooks (task-7.1)
  - Recipe grid component (`src/components/recipes/recipe-grid.tsx`) with Load More support
  - Recipe card component (`src/components/recipes/recipe-card.tsx`) with tag and save integration
  - Header component with navigation links (`src/components/layout/header.tsx`)
  - shadcn/ui components: `input`, `select`, `slider`, `checkbox`, `badge`, `button`, `sheet`, `command`, `popover`, `separator`, `scroll-area`
  - `lucide-react` icons installed
  - Tag toggles and save buttons on recipe cards (task-6.1)
- **What is missing**:
  - `src/components/search/search-bar.tsx` — Debounced search input with keyboard shortcut
  - `src/components/search/filter-panel.tsx` — Multi-filter sidebar/drawer
  - `src/components/search/active-filters.tsx` — Active filter chips with remove buttons
  - `src/app/(main)/search/page.tsx` — Search results page
  - Integration of search bar into the header
  - Tests for all search UI components and the search page

- **Relevant code**:
  - `src/components/layout/header.tsx` — Header where search bar will be integrated
  - `src/components/recipes/recipe-grid.tsx` — Grid component to reuse for results
  - `src/hooks/use-search.ts` — Hooks to consume
  - `src/app/(main)/my-recipes/page.tsx` — Pattern for a recipe listing page with client-side state
  - `src/app/(main)/my-collection/page.tsx` — Pattern for URL-driven state with tabs (task-6.2)
  - `src/components/layout/mobile-nav.tsx` — Mobile navigation pattern

---

## Desired Outcome

- **End state**: A complete search experience: a search bar in the header that navigates to a search results page, a filter panel with all filter options, active filter chips, URL-driven filter state for shareable/bookmarkable results, and responsive design for mobile.
- **User-facing changes**:
  - Search bar visible in the header (desktop: inline, mobile: icon that expands)
  - Keyboard shortcut Cmd/Ctrl + K focuses the search bar
  - Typing in the search bar and pressing Enter navigates to `/search?q=...`
  - Search results page shows results in a recipe grid with pagination
  - Filter panel (sidebar on desktop, sheet/drawer on mobile) with: cuisine multi-select, difficulty radio, prep time slider, cook time slider, dietary tags checkboxes, minimum rating stars
  - Active filters shown as removable chips above results
  - Sort dropdown (Relevance, Newest, Rating, Prep Time, Title)
  - Result count displayed ("12 recipes found")
  - Empty state ("No recipes match your search")
  - All filter state synced to URL search params (shareable/bookmarkable)
- **Developer-facing changes**:
  - `src/components/search/search-bar.tsx` — Search bar component
  - `src/components/search/filter-panel.tsx` — Filter panel component
  - `src/components/search/active-filters.tsx` — Active filter chips component
  - `src/app/(main)/search/page.tsx` — Search results page
  - Updated `src/components/layout/header.tsx` — Search bar integration
  - Tests for all new components and the page

---

## Scope & Boundaries

### In Scope

- Create search bar component with debounced input and keyboard shortcut
- Create filter panel component with all filter types
- Create active filter chips component
- Create search results page with grid, pagination, sort, and URL-driven state
- Integrate search bar into the header (desktop and mobile)
- Write tests for all new components and the page

### Out of Scope

- Modifying the search API routes or hooks (task-7.1 — done)
- Community page (Phase 8 — task-8.3)
- Guest access restrictions / summary-only cards (Phase 8 — task-8.3)
- Autocomplete/suggestions dropdown in the search bar (enhancement for later)
- Search history or recent searches feature
- Modifying recipe card or recipe grid components (task-5.3 / task-6.1 — done)

### Dependencies

- Search API route functional (task-7.1 — done)
- React Query hooks for search available (task-7.1 — done)
- Cuisine options and dietary tags endpoints live (task-7.1 — done)
- Recipe grid and card components exist (task-5.3 — done)
- Tag toggles and save buttons integrated into cards (task-6.1 — done)

---

## Implementation Details

### Section 1: Search Bar Component (`src/components/search/search-bar.tsx`)

**What to do**: Create a search bar input component with debounce, loading state, and keyboard shortcut.

**Where to find context**:

- `docs/ROADMAP.md` (lines 669-673) — Search bar specs
- `src/components/ui/input.tsx` — shadcn/ui Input component
- `src/hooks/use-search.ts` — `useDebouncedValue()` hook

**Specific requirements**:

1. **Props interface**:
   - `defaultValue?: string` — Pre-populate from URL query (for search results page)
   - `variant?: 'header' | 'page'` — `header` is compact (for header placement), `page` is full-width (for search page)
   - `onSearch?: (query: string) => void` — Callback when search is submitted (optional — defaults to navigation)

2. **Visual elements**:
   - Search icon (`Search` from lucide-react) on the left
   - Text input with placeholder "Search recipes..."
   - Clear button (`X` icon) when input has text
   - Loading spinner when search is in progress (optional, via `isSearching` prop or internal state)
   - Keyboard shortcut hint "Cmd+K" / "Ctrl+K" shown in the input (desktop only, `header` variant)

3. **Behavior**:
   - On Enter press: navigate to `/search?q={value}` (using `router.push()`)
   - On clear: empty the input and call `onSearch('')` or navigate to `/search`
   - Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux) focuses the input
     - Use `useEffect` with `keydown` event listener
     - Prevent default browser behavior for Cmd+K
   - When `variant="page"`: do NOT navigate on Enter — instead, call `onSearch` prop to update filters in place
   - When `variant="header"`: navigate to search page on Enter

4. **Responsive**:
   - `header` variant on desktop: Inline input (200-300px width)
   - `header` variant on mobile: Show only a search icon button that, when clicked, expands to a full-width input (or opens a search overlay)
   - `page` variant: Full-width input

**Patterns to follow**:

- `'use client'` directive
- Named export
- Use shadcn/ui `Input` as the base
- Use `useRouter()` from `next/navigation` for navigation

---

### Section 2: Filter Panel Component (`src/components/search/filter-panel.tsx`)

**What to do**: Create a filter panel with all filter options for the search page.

**Where to find context**:

- `docs/ROADMAP.md` (lines 674-677) — Filter panel specs
- `src/hooks/use-search.ts` — `useCuisineOptions()`, `useDietaryTags()` hooks
- shadcn/ui components: `select`, `checkbox`, `slider`, `button`, `sheet`, `separator`

**Specific requirements**:

1. **Props interface**:
   - `filters: SearchFilters` — Current filter values
   - `onFilterChange: (filters: SearchFilters) => void` — Callback when filters change
   - `isLoading?: boolean` — Disable interactions while loading

2. **Filter sections** (each collapsible on mobile):

   a. **Cuisine Type** — Multi-select or combobox:
   - Options populated from `useCuisineOptions()` hook
   - Show loading skeleton while options load
   - Allow selecting multiple cuisines (passed as comma-separated to API)
   - Display selected cuisines as chips
   - NOTE: The current `searchFilterSchema` accepts a single `cuisine` string. For this UI, use a single select dropdown. Multi-cuisine filtering is an enhancement for later.

   b. **Difficulty** — Radio group or segmented control:
   - Options: Any (default), Easy, Medium, Hard
   - "Any" clears the difficulty filter

   c. **Prep Time** — Slider or preset buttons:
   - Range: 0-120 minutes
   - Show preset buttons: "< 15 min", "< 30 min", "< 60 min", "Any"
   - Display current max value

   d. **Cook Time** — Same pattern as Prep Time:
   - Range: 0-180 minutes
   - Presets: "< 30 min", "< 60 min", "< 120 min", "Any"

   e. **Dietary Tags** — Checkbox group:
   - Options populated from `useDietaryTags()` hook
   - Multi-select (multiple tags can be active simultaneously)
   - Show loading skeleton while options load

   f. **Minimum Rating** — Star selector:
   - 1-5 stars, click to set minimum
   - Display: "4+ stars", "3+ stars", etc.
   - Click active rating to clear filter

3. **Action buttons**:
   - "Apply Filters" — Calls `onFilterChange` with current panel state (only if panel is in "apply mode" — for mobile)
   - "Clear All" — Resets all filters to defaults

4. **Layout**:
   - Desktop: Sidebar (left side, ~280px wide, sticky, scrollable)
   - Mobile: Hidden behind a "Filters" button that opens a `Sheet` (slides from left or bottom)
   - Show active filter count badge on the mobile "Filters" button

**Patterns to follow**:

- `'use client'` directive
- Named export
- Use shadcn/ui components throughout
- On desktop: filters apply immediately on change (no "Apply" button needed)
- On mobile: batch changes behind "Apply Filters" button in the Sheet

---

### Section 3: Active Filters Component (`src/components/search/active-filters.tsx`)

**What to do**: Create a component that displays active filters as removable chips.

**Where to find context**:

- `docs/ROADMAP.md` (line 677) — Active filter count badge (implied active filter display)

**Specific requirements**:

1. **Props interface**:
   - `filters: SearchFilters` — Current active filters
   - `onRemoveFilter: (key: string, value?: string) => void` — Callback to remove a specific filter
   - `onClearAll: () => void` — Callback to clear all filters

2. **Display**:
   - Render a horizontal scrollable row of chips
   - Each chip shows: filter label + value (e.g., "Cuisine: Italian", "Difficulty: Easy", "Max Prep: 30 min", "Dietary: Vegan", "Min Rating: 4+")
   - Each chip has an X button to remove that filter
   - "Clear All" button at the end (only shown when 2+ filters active)
   - Hidden when no filters are active (besides the search query)

3. **Styling**:
   - Use shadcn/ui `Badge` with `variant="secondary"` for chips
   - X button uses `X` icon from lucide-react
   - Horizontal scroll on mobile (no wrapping)

**Patterns to follow**:

- `'use client'` directive
- Named export
- Simple presentational component with callbacks

---

### Section 4: Search Results Page (`src/app/(main)/search/page.tsx`)

**What to do**: Create the search results page that combines the search bar, filter panel, active filters, sort dropdown, and recipe grid.

**Where to find context**:

- `docs/ROADMAP.md` (lines 678-683) — Search results page specs
- `src/app/(main)/my-collection/page.tsx` — Pattern for URL-driven state page (task-6.2)
- `src/hooks/use-search.ts` — `useSearch()` hook

**Specific requirements**:

1. **Page metadata**: Title "Search Recipes", description "Search and discover recipes"

2. **URL-driven state** — All filter state synced to URL search params:
   - `q` — search query
   - `cuisine` — cuisine filter
   - `difficulty` — difficulty filter
   - `maxPrepTime` — max prep time
   - `maxCookTime` — max cook time
   - `dietary` — dietary tag IDs (multiple via repeated param)
   - `minRating` — minimum rating
   - `sort` — sort order (default: `relevance` when `q` is set, `newest` otherwise)
   - `page` — current page
   - Read initial state from `useSearchParams()`
   - Update URL on every filter/sort/page change using `router.replace()` (not `push`, to avoid polluting history)

3. **Page layout**:

   ```
   ┌──────────────────────────────────────────┐
   │  Search Bar (page variant, full width)    │
   ├──────────┬───────────────────────────────┤
   │          │  Active Filters (chips)        │
   │  Filter  │  Result Count + Sort Dropdown  │
   │  Panel   │  ┌─────┬─────┬─────┬─────┐   │
   │  (sidebar│  │Card │Card │Card │Card │   │
   │  desktop,│  ├─────┼─────┼─────┼─────┤   │
   │  sheet   │  │Card │Card │Card │Card │   │
   │  mobile) │  └─────┴─────┴─────┴─────┘   │
   │          │  [Load More / Pagination]      │
   └──────────┴───────────────────────────────┘
   ```

4. **Search bar** at the top:
   - `variant="page"` — full width, no navigation on Enter
   - Pre-populated with `q` from URL
   - On change: update `q` in URL params (debounced via `useDebouncedValue`)

5. **Result info bar**:
   - Left: Result count — "12 recipes found" (or "No recipes found")
   - Right: Sort dropdown — "Sort by: Relevance / Newest / Rating / Prep Time / Title"
   - When `q` is empty: default sort to "Newest" instead of "Relevance"

6. **Recipe grid**:
   - Reuse `RecipeGrid` component
   - Pass recipes from `useSearch()` hook
   - Loading state: show skeleton grid
   - Empty state: "No recipes match your search. Try different keywords or adjust your filters."
   - Load More pagination (or numbered pagination)

7. **Filter interaction flow**:
   - User types in search bar → debounced `q` updates → URL updates → `useSearch` refetches
   - User changes a filter → URL updates → `useSearch` refetches
   - User clicks active filter chip X → filter removed from URL → `useSearch` refetches
   - User clicks sort dropdown → URL updates → `useSearch` refetches
   - User clicks Load More → page increments → URL updates → `useSearch` fetches next page
   - Direct URL visit (e.g., `/search?q=pasta&cuisine=Italian`) → page initializes with those filters

8. **Responsive**:
   - Mobile: Filter panel opens as Sheet, search bar full width, single column grid
   - Desktop: Filter panel as sidebar, search bar full width, multi-column grid

**Patterns to follow**:

- Client component (`'use client'`)
- Use `useSearchParams()` for reading URL state
- Use `useRouter()` with `router.replace()` for updating URL state
- Build a `useSearchPageState()` custom hook (local to the file or extracted) that bridges URL params → `SearchFilters` → `useSearch()` hook

---

### Section 5: Header Search Bar Integration

**What to do**: Integrate the search bar component into the header.

**Where to find context**:

- `src/components/layout/header.tsx` — Header component
- `src/components/layout/mobile-nav.tsx` — Mobile navigation

**Specific requirements**:

1. **Desktop header**:
   - Replace any search placeholder with the `SearchBar` component (`variant="header"`)
   - Position between the logo/nav links and the user avatar area
   - Width: ~250-300px, or use flex to fill available space

2. **Mobile header**:
   - Show a search icon button (magnifying glass) in the header
   - On click: navigate to `/search` page (where the full search bar is available)
   - Alternative: expand an input overlay in the header (simpler approach: just navigate to `/search`)

3. **Keyboard shortcut**:
   - Cmd+K / Ctrl+K should focus the header search bar on desktop
   - On mobile: Cmd+K navigates to `/search`

**Patterns to follow**:

- Follow existing header component patterns
- The search bar is a client component; ensure it works within the header (which may be a server component — wrap in client boundary as needed)

---

### Section 6: Tests

**What to do**: Write tests for all new search UI components and the search results page.

**Where to find context**:

- `src/components/recipes/__tests__/recipe-card.test.tsx` — Component test pattern
- `src/app/(main)/my-recipes/__tests__/page.test.tsx` — Page test pattern (if exists)
- `src/components/layout/__tests__/header.test.tsx` — Header test pattern

**Specific requirements**:

**SearchBar Tests** (`src/components/search/__tests__/search-bar.test.tsx`):

- Renders with placeholder text
- Enter press navigates to `/search?q=...` in header variant
- Enter press calls `onSearch` in page variant
- Clear button empties input
- Keyboard shortcut Cmd+K focuses input
- Pre-populates with `defaultValue`
- Shows keyboard hint in header variant

**FilterPanel Tests** (`src/components/search/__tests__/filter-panel.test.tsx`):

- Renders all filter sections
- Cuisine select shows options from hook
- Difficulty radio selection updates filters
- Prep time slider/presets update filters
- Dietary tag checkboxes toggle correctly
- Rating stars set minimum rating
- Clear All resets all filters
- Mobile: renders as Sheet when triggered

**ActiveFilters Tests** (`src/components/search/__tests__/active-filters.test.tsx`):

- Renders chips for each active filter
- Click X removes specific filter
- Clear All removes all filters
- Hidden when no filters active
- Shows correct labels for each filter type

**Search Page Tests** (`src/app/(main)/search/__tests__/page.test.tsx`):

- Renders search bar, filter panel, and grid
- Initializes filters from URL search params
- Updates URL when filters change
- Shows result count
- Shows sort dropdown
- Shows empty state when no results
- Shows loading skeleton while fetching
- Load More button fetches next page

**Header Integration Tests** (update `src/components/layout/__tests__/header.test.tsx`):

- Search bar renders in the header
- Search bar navigates to `/search` on Enter

**Patterns to follow**:

- Use `vi.mock()` for mocking hooks and router
- Use `vi.hoisted()` for hoisted mocks
- Co-located `__tests__/` directory pattern
- Mock `useSearchParams()` and `useRouter()` from `next/navigation`
- Mock `useSearch()`, `useCuisineOptions()`, `useDietaryTags()` hooks

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] Search bar in header accepts text input and navigates to `/search?q=...` on Enter
- [ ] Cmd+K / Ctrl+K keyboard shortcut focuses the header search bar
- [ ] Search results page shows results from the `useSearch()` hook
- [ ] Typing in the search bar on the search page debounces and updates results
- [ ] Filter panel renders all filter sections: cuisine, difficulty, prep time, cook time, dietary, rating
- [ ] Changing a filter updates the URL and refetches results
- [ ] Active filter chips display for each active filter
- [ ] Clicking X on a chip removes that filter
- [ ] "Clear All" removes all filters
- [ ] Sort dropdown changes result ordering
- [ ] Sort defaults to "Relevance" when search query is present, "Newest" when absent
- [ ] Result count displays correctly ("12 recipes found")
- [ ] Empty state displays when no results match
- [ ] Loading skeleton displays while fetching
- [ ] Load More pagination works
- [ ] Direct URL visit (e.g., `/search?q=pasta&cuisine=Italian`) initializes with correct filters
- [ ] URL is shareable/bookmarkable — refreshing preserves all filter state
- [ ] Mobile: filter panel opens as Sheet/drawer
- [ ] Mobile: search icon in header navigates to search page
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Reuses existing components (`RecipeGrid`, `RecipeCard`, shadcn/ui primitives)
- [ ] URL state management is clean and does not pollute browser history (uses `replace` not `push`)
- [ ] Filter panel is accessible (keyboard navigable, proper ARIA labels)

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

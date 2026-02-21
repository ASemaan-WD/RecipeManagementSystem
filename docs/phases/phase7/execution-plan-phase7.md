# Phase 7 Execution Plan — Search & Discovery

## Task 7.1: Search API & Utilities

### Files Created (12)

| File                                                      | Purpose                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/lib/search.ts`                                       | Pure utility functions: `sanitizeSearchQuery`, `buildTsQueryString`, `buildSearchWhereClause`, `buildSearchOrderBy` |
| `src/lib/validations/search.ts`                           | `searchFilterSchema` with q/cuisine/difficulty/times/dietary/rating/sort/pagination                                 |
| `src/app/api/search/route.ts`                             | Two-pass FTS search: raw SQL for ranking + Prisma for rich data                                                     |
| `src/app/api/search/cuisines/route.ts`                    | Public endpoint returning distinct cuisine types                                                                    |
| `src/app/api/search/dietary-tags/route.ts`                | Public endpoint returning all dietary tags                                                                          |
| `src/hooks/use-search.ts`                                 | `useSearch`, `useDebouncedValue`, `useCuisineOptions`, `useDietaryTags` hooks                                       |
| `src/lib/__tests__/search.test.ts`                        | 30 tests for pure utility functions                                                                                 |
| `src/lib/validations/__tests__/search.test.ts`            | 11 tests for schema validation                                                                                      |
| `src/app/api/search/__tests__/route.test.ts`              | 11 tests: FTS/filter-only/visibility/validation                                                                     |
| `src/app/api/search/cuisines/__tests__/route.test.ts`     | 2 tests                                                                                                             |
| `src/app/api/search/dietary-tags/__tests__/route.test.ts` | 2 tests                                                                                                             |
| `src/hooks/__tests__/use-search.test.ts`                  | 5 tests for `useDebouncedValue`                                                                                     |

### Key Decisions

- **Two-pass FTS approach**: Pass 1 uses `prisma.$queryRaw` with `searchVector @@ to_tsquery` + `ts_rank` to get ranked IDs; Pass 2 uses `prisma.recipe.findMany` with lean select for full data with relations; results re-sorted by rank
- Falls back to standard Prisma query when no `q` provided (filter-only mode)
- `buildTsQueryString` joins words with `&` and appends `:*` to last word for prefix matching
- `sanitizeSearchQuery` strips dangerous tsquery operators to prevent SQL errors
- Raw SQL wrapped in try/catch — returns empty results on tsquery parse errors
- `useSearch` uses `keepPreviousData` to prevent layout shift during filter changes
- `useCuisineOptions` and `useDietaryTags` have 5-minute staleTime for infrequent data

---

## Task 7.2: Search UI & Results Page

### Files Created (8)

| File                                                      | Purpose                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/components/search/search-bar.tsx`                    | Search input with Cmd+K shortcut, header/page variants                                               |
| `src/components/search/filter-panel.tsx`                  | Filter sidebar: cuisine, difficulty, prep/cook time, dietary, rating; desktop sidebar + mobile Sheet |
| `src/components/search/active-filters.tsx`                | Horizontal scrollable Badge chips with remove buttons                                                |
| `src/app/(main)/search/page.tsx`                          | Full search results page with URL-driven state, debounced query, Load More                           |
| `src/components/search/__tests__/search-bar.test.tsx`     | 15 tests: render, Enter, clear, Cmd+K, variants                                                      |
| `src/components/search/__tests__/filter-panel.test.tsx`   | 16 tests: all sections, filter changes, clear, mobile trigger                                        |
| `src/components/search/__tests__/active-filters.test.tsx` | 13 tests: chips, remove, clear, hidden                                                               |
| `src/app/(main)/search/__tests__/page.test.tsx`           | 8 tests: URL init, filter updates, empty state, loading, sort                                        |

### Files Modified (2)

| File                                   | Changes                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/header.tsx`     | Replaced disabled search input with `<SearchBar variant="header" />`; added mobile search icon link to `/search` |
| `src/components/layout/mobile-nav.tsx` | Added `{ label: 'Search', href: '/search', icon: Search }` to `MOBILE_NAV_ITEMS`                                 |

### Key Decisions

- **SearchBar** has two variants: `header` (navigate to `/search?q=...`) and `page` (call `onSearch` callback)
- Cmd+K / Ctrl+K keyboard shortcut focuses the search input globally
- **FilterPanel** renders as 280px sticky sidebar on desktop, Sheet overlay on mobile
- Mobile "Filters" button shows active filter count badge
- Radix Select `<SelectItem>` requires non-empty values — used `"__any__"` sentinel for "Any cuisine" option
- **ActiveFilters** chips show "Clear All" only when 2+ filters are active
- Search page uses `useDebouncedValue` (300ms) for the query input to avoid excessive API calls
- Sort defaults to `relevance` when `q` is set, `newest` otherwise
- URL state persisted via `useSearchParams()` / `router.replace()` for shareable search URLs

---

## Verification

- **Tests**: 113 new tests across 15 test files (Tasks 7.1 + 7.2)
- **Build**: Zero TypeScript errors, successful production build
- **Total test count after Phase 7**: 395 tests across 38 test files

## Summary of All New Routes

| Route                      | Method | Auth     | Purpose                       |
| -------------------------- | ------ | -------- | ----------------------------- |
| `/api/search`              | GET    | Optional | Full-text search with filters |
| `/api/search/cuisines`     | GET    | None     | Distinct cuisine type options |
| `/api/search/dietary-tags` | GET    | None     | All dietary tag options       |

## Summary of All New Pages

| Page      | Type            | Purpose                                      |
| --------- | --------------- | -------------------------------------------- |
| `/search` | Client (static) | Search results with filters, sort, Load More |

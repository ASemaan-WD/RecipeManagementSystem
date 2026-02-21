# Phase 6 Execution Plan — Status Tagging & Collections

## Task 6.1: Tagging & Save API with UI Components

### Files Created (11)

| File                                                    | Purpose                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/validations/tags.ts`                           | Zod schemas for tag/save operations (`addTagSchema`, `removeTagSchema`, `TAG_STATUS_VALUES`) |
| `src/app/api/recipes/[id]/tags/route.ts`                | POST/DELETE endpoints for user recipe tags (FAVORITE, TO_TRY, MADE_BEFORE)                   |
| `src/app/api/recipes/[id]/save/route.ts`                | POST/DELETE endpoints for saving/unsaving recipes                                            |
| `src/hooks/use-tags.ts`                                 | React Query hooks: `useToggleTag()`, `useToggleSave()` with optimistic updates               |
| `src/components/recipes/tag-toggles.tsx`                | Toggle buttons for FAVORITE/TO_TRY/MADE_BEFORE with compact/full variants                    |
| `src/components/recipes/save-button.tsx`                | Save/unsave button with compact/full variants                                                |
| `src/app/api/recipes/[id]/tags/__tests__/route.test.ts` | 10 tests: auth, validation, idempotency, 404, 401                                            |
| `src/app/api/recipes/[id]/save/__tests__/route.test.ts` | 6 tests: auth, save/unsave, idempotency                                                      |
| `src/components/recipes/__tests__/tag-toggles.test.tsx` | 5 tests: both variants, active/inactive, click, disabled                                     |
| `src/components/recipes/__tests__/save-button.test.tsx` | 6 tests: states, click, disabled                                                             |
| `src/hooks/__tests__/use-tags.test.ts`                  | 5 tests: mutation hooks, optimistic updates                                                  |

### Files Modified (3)

| File                                     | Changes                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `src/app/(main)/recipes/[id]/page.tsx`   | Added TagToggles and SaveButton to recipe detail page                     |
| `src/components/recipes/recipe-card.tsx` | Added compact TagToggles and SaveButton to recipe cards                   |
| `src/test/factories.ts`                  | Added `createMockUserRecipeTag()` and `createMockSavedRecipe()` factories |

### Key Decisions

- Tag/save APIs are idempotent: POST returns existing if duplicate, DELETE succeeds if not found
- Optimistic updates update both `['recipe', id]` and `['recipes']` query caches
- `useToggleTag` and `useToggleSave` also invalidate `['collection']` for Task 6.2 integration
- `e.preventDefault()` + `e.stopPropagation()` on tag/save buttons to prevent card navigation

---

## Task 6.2: My Collection Page

### Files Created (4)

| File                                                   | Purpose                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/app/api/collections/route.ts`                     | GET endpoint with tab filtering (all/favorites/to-try/made-before/saved), parallel count queries |
| `src/app/(main)/my-collection/page.tsx`                | Client page with 5 tabs, count badges, sort dropdown, Load More pagination                       |
| `src/app/api/collections/__tests__/route.test.ts`      | 10 tests: each tab, pagination, sort, counts, 401                                                |
| `src/app/(main)/my-collection/__tests__/page.test.tsx` | 8 tests: tabs, empty states, sort, URL state                                                     |

### Files Modified (3)

| File                               | Changes                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/lib/validations/tags.ts`      | Added `collectionFilterSchema` with tab/page/limit/sort validation                              |
| `src/hooks/use-tags.ts`            | Added `useCollection()` hook, `CollectionCounts`/`CollectionFilters`/`CollectionResponse` types |
| `src/components/layout/header.tsx` | Moved "My Collection" from dropdown `USER_MENU_ITEMS` to desktop nav `DESKTOP_NAV_ITEMS`        |

### Key Decisions

- Collection API runs 7 parallel queries via `Promise.all`: data + count + 5 tab counts
- Tab-specific empty states with CTAs linking to `/search`
- URL-driven state via `useSearchParams()` / `router.replace()` (same pattern as My Recipes)
- Load More pagination with accumulated recipes state

---

## Verification

- **Tests**: 42 new tests across 7 test files, all passing
- **Build**: Zero TypeScript errors, successful production build
- **Total test count after Phase 6**: 343 tests across 34 test files

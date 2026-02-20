---
task_id: 'task-5.6'
title: 'Write Tests for Recipe CRUD'
phase: 5
task_number: 6
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-5.2'
  - 'task-5.3'
  - 'task-5.4'
  - 'task-5.5'
blocks: []
created_at: '2026-02-20'
---

# Write Tests for Recipe CRUD

## Current State

> All Phase 5 implementation tasks (5.1–5.5) are complete. The testing infrastructure is already set up from Phase 3/4: Vitest, @testing-library/react, MSW, and mock factories exist. Tests for auth and layout already pass.

- **What exists**:
  - `vitest.config.ts` — Test runner configured with jsdom, setup files, path aliases
  - `src/test/setup.ts` — Global test setup with MSW server
  - `src/test/factories.ts` — Mock factories (`createMockUser`, `createMockSession`, `createMockRecipe`, plus new factories from task-5.1)
  - `src/mocks/handlers.ts` — MSW handlers for auth endpoints
  - `src/mocks/server.ts` — MSW server setup
  - Existing test files in `src/lib/__tests__/`, `src/lib/validations/__tests__/`, `src/app/api/auth/username/__tests__/`, `src/components/layout/__tests__/`, `src/app/(auth)/login/__tests__/`, etc.
  - All Phase 5 implementation: types, validation schemas, API routes, form wizard, card/grid, detail page, pages, hooks
- **What is missing**:
  - Tests for recipe validation schemas
  - Tests for recipe API routes
  - Tests for recipe components (form wizard, card, grid, detail page)
  - Tests for React Query hooks
  - MSW handlers for recipe API endpoints
- **Relevant code**:
  - `src/lib/validations/__tests__/auth.test.ts` — Existing validation test pattern
  - `src/app/api/auth/username/__tests__/route.test.ts` — Existing API route test pattern
  - `src/components/layout/__tests__/` — Existing component test pattern
  - `src/mocks/handlers.ts` — Where to add recipe MSW handlers
  - `src/test/factories.ts` — Mock data factories

---

## Desired Outcome

- **End state**: Comprehensive test coverage for all Phase 5 code — validation schemas, API routes, components, and hooks. All tests pass. Existing tests continue to pass.
- **User-facing changes**: None.
- **Developer-facing changes**:
  - `src/mocks/handlers.ts` — Updated with recipe API mock handlers
  - `src/lib/validations/__tests__/recipe.test.ts` — Validation schema tests
  - `src/app/api/recipes/__tests__/route.test.ts` — Recipe list/create API tests
  - `src/app/api/recipes/[id]/__tests__/route.test.ts` — Recipe detail/update/delete API tests
  - `src/app/api/recipes/[id]/duplicate/__tests__/route.test.ts` — Duplicate API tests
  - `src/app/api/images/__tests__/` — Image API tests
  - `src/components/recipes/__tests__/recipe-card.test.tsx` — Card component tests
  - `src/components/recipes/__tests__/recipe-grid.test.tsx` — Grid component tests
  - `src/components/recipes/recipe-form/__tests__/` — Form wizard tests
  - `src/hooks/__tests__/use-recipes.test.ts` — Hook tests

---

## Scope & Boundaries

### In Scope

- Add recipe API MSW handlers to `src/mocks/handlers.ts`
- Write unit tests for Zod validation schemas (createRecipeSchema, updateRecipeSchema, recipeFilterSchema)
- Write unit tests for API routes (mocking Prisma and auth)
- Write component tests for recipe card, grid, and key form wizard behaviors
- Write hook tests for React Query hooks (using MSW for API mocking)
- Ensure all existing tests still pass

### Out of Scope

- E2E tests (Playwright) — Phase 11
- Tests for features not yet implemented (tags, search, sharing, ratings, comments)
- Performance/load tests
- Visual regression tests
- 100% code coverage — focus on critical paths and edge cases

### Dependencies

- All Phase 5 implementation tasks (5.1–5.5)

---

## Implementation Details

### Section 1: Recipe MSW Handlers (`src/mocks/handlers.ts`)

**What to do**: Add MSW request handlers for all recipe API endpoints.

**Where to find context**:

- `src/mocks/handlers.ts` — Existing handlers pattern
- `src/app/api/recipes/route.ts` — API shape to mock

**Specific requirements**:

Add handlers for:

1. `GET /api/recipes` — Returns paginated recipe list (use `createMockRecipeListItem()`)
2. `POST /api/recipes` — Returns created recipe
3. `GET /api/recipes/:id` — Returns full recipe detail (use `createMockRecipeDetail()`)
4. `PUT /api/recipes/:id` — Returns updated recipe
5. `DELETE /api/recipes/:id` — Returns `{ success: true }`
6. `POST /api/recipes/:id/duplicate` — Returns duplicated recipe
7. `DELETE /api/images/:id` — Returns `{ success: true }`
8. `POST /api/images/upload-signature` — Returns mock signature data

Include error scenario handlers (can be overridden per test):

- 401 for unauthenticated requests
- 404 for non-existent recipes
- 400 for validation errors

---

### Section 2: Validation Schema Tests (`src/lib/validations/__tests__/recipe.test.ts`)

**What to do**: Test all Zod validation schemas for correctness.

**Where to find context**:

- `src/lib/validations/__tests__/auth.test.ts` — Existing test pattern
- `src/lib/validations/recipe.ts` — Schemas to test

**Specific requirements**:

**`createRecipeSchema` tests:**

- Accepts valid complete recipe data
- Rejects missing required fields (name, description, prepTime, cookTime, servings, difficulty, cuisineType)
- Rejects name exceeding 200 characters
- Rejects description exceeding 2000 characters
- Rejects non-positive prepTime, cookTime
- Rejects servings outside 1-100 range
- Rejects invalid difficulty enum value
- Rejects empty ingredients array
- Rejects empty steps array
- Accepts optional fields as undefined/missing (dietaryTagIds, images)
- Validates nested ingredient objects (name required, order required)
- Validates nested step objects (instruction required, stepNumber required)
- Applies default values (visibility: PRIVATE, dietaryTagIds: [], images: [])

**`updateRecipeSchema` tests:**

- Accepts partial data (any single field is valid)
- Applies same validation rules to provided fields
- Accepts empty object (no fields to update)

**`recipeFilterSchema` tests:**

- Applies defaults (page: 1, limit: 12, sort: 'newest')
- Coerces string numbers to integers (page, limit, maxPrepTime)
- Rejects limit > 50
- Rejects invalid sort value
- Accepts valid filter combinations

---

### Section 3: API Route Tests

**What to do**: Test recipe API routes with mocked Prisma client and auth.

**Where to find context**:

- `src/app/api/auth/username/__tests__/route.test.ts` — Existing API test pattern

**Specific requirements**:

Test files and cases:

**`src/app/api/recipes/__tests__/route.test.ts`:**

- GET: returns paginated recipes for authenticated user
- GET: returns only public recipes for unauthenticated user
- GET: applies filters correctly (cuisine, difficulty, maxPrepTime)
- GET: applies sorting correctly
- GET: respects pagination (page, limit)
- POST: creates recipe with valid data
- POST: returns 400 for invalid data with field errors
- POST: returns 401 for unauthenticated
- POST: creates ingredients with upsert (new + existing)
- POST: creates steps, images, dietary tag associations

**`src/app/api/recipes/[id]/__tests__/route.test.ts`:**

- GET: returns full recipe detail for owner
- GET: returns recipe for public visibility
- GET: returns 404 for private recipe of another user
- GET: accepts share token for shared access
- PUT: updates recipe with valid partial data
- PUT: returns 403 for non-owner
- PUT: returns 401 for unauthenticated
- PUT: replaces ingredients/steps/images arrays
- DELETE: deletes recipe for owner
- DELETE: returns 403 for non-owner

**`src/app/api/recipes/[id]/duplicate/__tests__/route.test.ts`:**

- POST: duplicates recipe with " (Copy)" suffix
- POST: sets new author and PRIVATE visibility
- POST: copies all relations (ingredients, steps, images, dietary tags)
- POST: resets avgRating and ratingCount
- POST: returns 401 for unauthenticated
- POST: returns 404 for inaccessible recipe

**`src/app/api/images/__tests__/upload-signature.test.ts`:**

- POST: returns valid signature for authenticated user
- POST: returns 401 for unauthenticated

**`src/app/api/images/[id]/__tests__/route.test.ts`:**

- DELETE: removes image for recipe owner
- DELETE: returns 403 for non-owner
- DELETE: returns 404 for non-existent image

---

### Section 4: Component Tests

**What to do**: Test recipe display and form components.

**Where to find context**:

- `src/components/layout/__tests__/` — Existing component test patterns

**Specific requirements**:

**`src/components/recipes/__tests__/recipe-card.test.tsx`:**

- Renders recipe title, cuisine, difficulty, time, rating, author
- Renders fallback image when no primary image
- Links to correct recipe detail URL
- Shows difficulty color coding (green for EASY, amber for MEDIUM, red for HARD)
- Shows visibility icon
- Handles missing optional data gracefully (null rating, null cuisine)

**`src/components/recipes/__tests__/recipe-grid.test.tsx`:**

- Renders correct number of recipe cards
- Shows skeleton cards when `isLoading` is true
- Shows empty state when recipes array is empty
- Shows "Load More" button when `hasMore` is true
- Calls `onLoadMore` when "Load More" is clicked

**`src/components/recipes/recipe-form/__tests__/recipe-form-wizard.test.tsx`:**

- Renders first step (Basic Info) initially
- Navigates to next step on "Next" click with valid data
- Prevents advancement with invalid data (shows validation errors)
- Navigates back on "Previous" click
- Shows "Submit" button on last step
- Calls `onSubmit` with form data on final submit
- Pre-populates fields in edit mode

---

### Section 5: React Query Hook Tests (`src/hooks/__tests__/use-recipes.test.ts`)

**What to do**: Test React Query hooks using MSW for API mocking.

**Where to find context**:

- React Query testing patterns (use `renderHook` from `@testing-library/react` with a QueryClient wrapper)

**Specific requirements**:

- `useRecipes()`: returns recipe list data, handles loading state, handles error state
- `useRecipe(id)`: returns recipe detail, handles 404
- `useCreateRecipe()`: calls POST, invalidates queries on success
- `useUpdateRecipe()`: calls PUT, invalidates queries on success
- `useDeleteRecipe()`: calls DELETE, invalidates queries on success
- `useDuplicateRecipe()`: calls POST, invalidates queries on success

Each test should:

- Wrap the hook in a `QueryClientProvider` with a fresh `QueryClient`
- Use MSW to mock API responses
- Assert on returned data, loading states, and error states

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] All tests pass (`npm run test:run`)

### Functional Verification

- [ ] All validation schema tests pass (createRecipeSchema, updateRecipeSchema, recipeFilterSchema)
- [ ] All API route tests pass (CRUD operations, auth checks, error cases)
- [ ] All component tests pass (recipe card, grid, form wizard)
- [ ] All hook tests pass (useRecipes, useRecipe, useCreateRecipe, useUpdateRecipe, useDeleteRecipe, useDuplicateRecipe)
- [ ] All existing tests (auth, layout, etc.) still pass
- [ ] MSW handlers are properly configured and used across all test files

### Code Quality Checks

- [ ] Tests follow existing patterns from `src/lib/validations/__tests__/` and `src/components/layout/__tests__/`
- [ ] Tests use mock factories from `src/test/factories.ts`
- [ ] No hardcoded magic values in tests — use factories and constants
- [ ] Each test file is focused on one module/component
- [ ] Tests cover both happy path and error scenarios

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were tested (no tag tests, no search tests, no sharing tests)
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new test code is traceable to Phase 5 implementation
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_

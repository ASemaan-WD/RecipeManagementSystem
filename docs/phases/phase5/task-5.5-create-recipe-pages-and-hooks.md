---
task_id: 'task-5.5'
title: 'Create Recipe Create, Edit & My Recipes Pages with React Query Hooks'
phase: 5
task_number: 5
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-5.2'
  - 'task-5.3'
  - 'task-5.4'
blocks:
  - 'task-5.6'
created_at: '2026-02-20'
---

# Create Recipe Create, Edit & My Recipes Pages with React Query Hooks

## Current State

> Recipe API routes (task-5.1), form wizard (task-5.2), card/grid components (task-5.3), and detail page (task-5.4) all exist. No React Query hooks for recipes or recipe CRUD pages have been created yet. The query provider is configured in `src/providers/query-provider.tsx` with default options (staleTime: 30s, retry: 1).

- **What exists**:
  - `src/types/recipe.ts` — All recipe types including `RecipeFormData`, `RecipeListItem`, `RecipeDetail`, `RecipeFilters`, `PaginatedResponse`
  - `src/lib/validations/recipe.ts` — Validation schemas
  - `src/app/api/recipes/route.ts` — GET (list) + POST (create) endpoints
  - `src/app/api/recipes/[id]/route.ts` — GET (detail) + PUT (update) + DELETE endpoints
  - `src/components/recipes/recipe-form/recipe-form-wizard.tsx` — Form wizard component
  - `src/components/recipes/recipe-card.tsx` — Recipe card component
  - `src/components/recipes/recipe-grid.tsx` — Recipe grid component
  - `src/app/(main)/recipes/[id]/page.tsx` — Recipe detail page
  - `src/providers/query-provider.tsx` — React Query configured
  - `@tanstack/react-query` installed
  - `sonner` for toast notifications
  - Middleware protects `/recipes/new` and `/recipes/*/edit` (auth required)
- **What is missing**:
  - `src/hooks/use-recipes.ts` — React Query hooks for all recipe operations
  - `src/app/(main)/recipes/new/page.tsx` — Create recipe page
  - `src/app/(main)/recipes/[id]/edit/page.tsx` — Edit recipe page
  - `src/app/(main)/my-recipes/page.tsx` — User's recipe list page
- **Relevant code**:
  - `src/providers/query-provider.tsx` — QueryClient configuration
  - `src/app/(auth)/onboarding/page.tsx` — Existing page pattern
  - `src/app/(main)/dashboard/page.tsx` — Existing authenticated page pattern
  - `docs/ROADMAP.md` (lines 547-571) — Pages and hooks specs

---

## Desired Outcome

- **End state**: Complete recipe management flow — users can create new recipes, edit existing ones, and view a list of all their recipes. All data fetching and mutations are handled through React Query hooks.
- **User-facing changes**:
  - `/recipes/new` — Create a new recipe using the form wizard
  - `/recipes/[id]/edit` — Edit an existing recipe with pre-populated form
  - `/my-recipes` — View all recipes authored by the current user with filtering and sorting
- **Developer-facing changes**:
  - `src/hooks/use-recipes.ts` — All React Query hooks for recipe operations
  - `src/app/(main)/recipes/new/page.tsx` — Create recipe page
  - `src/app/(main)/recipes/[id]/edit/page.tsx` — Edit recipe page
  - `src/app/(main)/my-recipes/page.tsx` — My recipes list page

---

## Scope & Boundaries

### In Scope

- Create React Query hooks for: listing recipes, fetching single recipe, creating, updating, deleting, and duplicating recipes
- Create the "Create Recipe" page mounting the form wizard in create mode
- Create the "Edit Recipe" page mounting the form wizard in edit mode with pre-populated data
- Create the "My Recipes" page with recipe grid, filter tabs, and sorting
- Wire up form wizard submission to API via React Query mutations
- Cache invalidation on create/update/delete mutations
- Success/error toast notifications
- Redirect after successful create/edit/delete

### Out of Scope

- Tag filtering in My Recipes (Favorites, To Try, Made Before tabs) — Phase 6
- Search/filter panel beyond basic tabs — Phase 7
- Community page — Phase 8
- Infinite scroll — use "Load More" button for now
- Optimistic updates for list operations — keep it simple with invalidation

### Dependencies

- Task-5.1 (types, validation, API routes)
- Task-5.2 (form wizard component)
- Task-5.3 (card/grid components)
- Task-5.4 (detail page — for redirect targets after create/edit)

---

## Implementation Details

### Section 1: React Query Hooks (`src/hooks/use-recipes.ts`)

**What to do**: Create all React Query hooks for recipe CRUD operations.

**Where to find context**:

- `docs/ROADMAP.md` (lines 563-571) — Hooks spec
- `src/providers/query-provider.tsx` — QueryClient defaults
- `src/types/recipe.ts` — Types for queries and mutations

**Specific requirements**:

1. **`useRecipes(filters: RecipeFilters)`** — Query hook for paginated recipe list:
   - Query key: `['recipes', filters]`
   - Fetches `GET /api/recipes` with filter params as query string
   - Returns `PaginatedResponse<RecipeListItem>`
   - Enabled by default

2. **`useRecipe(id: string)`** — Query hook for single recipe detail:
   - Query key: `['recipe', id]`
   - Fetches `GET /api/recipes/[id]`
   - Returns `RecipeDetail`
   - Enabled only when `id` is truthy

3. **`useCreateRecipe()`** — Mutation hook for creating a recipe:
   - Calls `POST /api/recipes` with `RecipeFormData` body
   - On success: invalidate `['recipes']` queries, show success toast, return created recipe
   - On error: show error toast with message

4. **`useUpdateRecipe()`** — Mutation hook for updating a recipe:
   - Calls `PUT /api/recipes/[id]` with partial `RecipeFormData` body
   - On success: invalidate `['recipes']` and `['recipe', id]` queries, show success toast
   - On error: show error toast

5. **`useDeleteRecipe()`** — Mutation hook for deleting a recipe:
   - Calls `DELETE /api/recipes/[id]`
   - On success: invalidate `['recipes']` queries, remove `['recipe', id]` from cache, show success toast
   - On error: show error toast

6. **`useDuplicateRecipe()`** — Mutation hook for duplicating a recipe:
   - Calls `POST /api/recipes/[id]/duplicate`
   - On success: invalidate `['recipes']` queries, show success toast, return new recipe
   - On error: show error toast

**Helper**: Create a private `recipesApi` object or individual fetch functions that handle the API calls with proper error handling (check `response.ok`, parse error messages from JSON body).

**Patterns to follow**:

- Use `useQuery` for read operations, `useMutation` for write operations
- Use `queryClient.invalidateQueries()` for cache invalidation
- Use `toast.success()` and `toast.error()` from `sonner` for notifications
- Import `useQueryClient` from `@tanstack/react-query` for cache operations

---

### Section 2: Create Recipe Page (`src/app/(main)/recipes/new/page.tsx`)

**What to do**: Create the page that mounts the recipe form wizard in create mode.

**Where to find context**:

- `docs/ROADMAP.md` (lines 548-550) — Create page spec

**Specific requirements**:

- Page title: "Create New Recipe"
- Render `RecipeFormWizard` with `mode="create"`
- Fetch dietary tags from the database (for the tags step) — either server-side or via a small API call
- Wire `onSubmit` to `useCreateRecipe()` mutation
- On success: redirect to `/recipes/[newRecipeId]` with success toast
- Show page-level loading/error states
- Breadcrumb or back link to `/my-recipes`
- This page is protected by middleware (requires auth)

---

### Section 3: Edit Recipe Page (`src/app/(main)/recipes/[id]/edit/page.tsx`)

**What to do**: Create the page that mounts the recipe form wizard in edit mode with pre-populated data.

**Where to find context**:

- `docs/ROADMAP.md` (lines 551-554) — Edit page spec

**Specific requirements**:

- Page title: "Edit Recipe" (or "Edit {recipe.name}")
- Fetch the existing recipe using `useRecipe(id)` or server-side fetch
- Only the recipe owner should access this page (middleware handles route protection; additionally verify ownership and show 403/redirect if not owner)
- Transform `RecipeDetail` data into `RecipeFormData` shape for the form default values:
  - Map `ingredients` array to `RecipeIngredientInput[]` format
  - Map `steps` array to `RecipeStepInput[]` format
  - Map `images` array to `RecipeImageInput[]` format
  - Map `dietaryTags` to `dietaryTagIds` string array
- Render `RecipeFormWizard` with `mode="edit"` and `defaultValues`
- Fetch dietary tags (same as create page)
- Wire `onSubmit` to `useUpdateRecipe()` mutation with the recipe ID
- On success: redirect to `/recipes/[id]` with success toast
- Show loading skeleton while recipe data is fetching
- Show error state if recipe fetch fails

---

### Section 4: My Recipes Page (`src/app/(main)/my-recipes/page.tsx`)

**What to do**: Create the page that displays all recipes authored by the current user.

**Where to find context**:

- `docs/ROADMAP.md` (lines 555-560) — My recipes page spec

**Specific requirements**:

- Page title: "My Recipes"
- Fetch the current user's recipes using `useRecipes()` with an appropriate filter (e.g., a `mine=true` query param, or filter by visibility on the API side — the GET `/api/recipes` endpoint already returns the user's own recipes)
- **Filter tabs** at the top: All, Public, Shared, Private
  - Each tab sets the `visibility` filter
  - "All" shows all the user's recipes regardless of visibility
  - Display recipe count per tab
- **Sort dropdown**: Newest, Oldest, Title A-Z
  - Sets the `sort` filter
- Display recipes using `RecipeGrid` component
- "Load More" pagination using `hasMore` and `onLoadMore` from the grid
- **"Create New Recipe" CTA button** — prominent, links to `/recipes/new`
- **Empty state** per tab:
  - "All" empty: "You haven't created any recipes yet. Start by creating your first recipe!"
  - Other tabs empty: "No {visibility} recipes found."
- URL-driven state: tab and sort reflected in URL query params (e.g., `/my-recipes?tab=public&sort=newest`)
- This page is protected by middleware (requires auth)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `useRecipes()` fetches and returns paginated recipe list
- [ ] `useRecipe(id)` fetches and returns single recipe detail
- [ ] `useCreateRecipe()` mutation creates a recipe and invalidates list cache
- [ ] `useUpdateRecipe()` mutation updates a recipe and invalidates caches
- [ ] `useDeleteRecipe()` mutation deletes a recipe and invalidates caches
- [ ] `useDuplicateRecipe()` mutation duplicates a recipe and invalidates list cache
- [ ] Create Recipe page renders form wizard in create mode
- [ ] Create Recipe page redirects to new recipe detail on success
- [ ] Edit Recipe page loads existing recipe data into form
- [ ] Edit Recipe page redirects to recipe detail on success
- [ ] Edit Recipe page prevents access by non-owners
- [ ] My Recipes page displays the current user's recipes
- [ ] My Recipes filter tabs work: All, Public, Shared, Private
- [ ] My Recipes sort dropdown works: Newest, Oldest, Title A-Z
- [ ] My Recipes "Load More" pagination works
- [ ] My Recipes "Create New Recipe" button links to `/recipes/new`
- [ ] My Recipes shows appropriate empty states per tab
- [ ] Success/error toast notifications appear for all mutations
- [ ] URL query params reflect tab and sort state on My Recipes
- [ ] All pages render correctly in both light and dark mode

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] React Query hooks are in a single `src/hooks/use-recipes.ts` file
- [ ] API fetch functions handle errors consistently

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

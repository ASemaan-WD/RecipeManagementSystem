---
task_id: 'task-6.1'
title: 'Tagging & Save API with UI Components'
phase: 6
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-5.4'
  - 'task-5.5'
blocks:
  - 'task-6.2'
created_at: '2026-02-21'
---

# Tagging & Save API with UI Components

## Current State

> Phase 5 (Recipe CRUD Operations) is complete. The Prisma schema already defines `UserRecipeTag` (multi-tag with `@@unique([userId, recipeId, status])`) and `SavedRecipe` (with `@@unique([userId, recipeId])`). The `GET /api/recipes` route already fetches `userTags` and `savedBy` for authenticated users and returns them in the response. The `RecipeListItem` type already includes optional `userTags?: { status: TagStatus }[]` and `isSaved?: boolean` fields. No API routes, UI components, or hooks exist yet for toggling tags or saves.

- **What exists**:
  - Prisma models `UserRecipeTag` and `SavedRecipe` defined and migrated (`prisma/schema.prisma`)
  - `TagStatus` enum: `FAVORITE`, `TO_TRY`, `MADE_BEFORE` (`prisma/schema.prisma`)
  - `RecipeListItem` type with `userTags?: { status: TagStatus }[]` and `isSaved?: boolean` (`src/types/recipe.ts`, lines 48-71)
  - `GET /api/recipes` already includes `userTags` and `savedBy` for authenticated users (`src/app/api/recipes/route.ts`, lines 153-164)
  - `GET /api/recipes/[id]` fetches user's tags and save status for authenticated users (`src/app/api/recipes/[id]/route.ts`)
  - Auth utilities: `requireAuth()`, `canViewRecipe()`, `getCurrentUser()` (`src/lib/auth-utils.ts`)
  - Existing mutation hook pattern with cache invalidation and toast (`src/hooks/use-recipes.ts`)
  - Existing Zod validation pattern (`src/lib/validations/recipe.ts`, `src/lib/validations/auth.ts`)
  - Test factories: `createMockRecipeListItem()`, `createMockRecipeDetail()` (`src/test/factories.ts`)
  - shadcn/ui components installed: `button`, `badge`, `tooltip`, `sonner`
  - `lucide-react` icons installed
- **What is missing**:
  - `src/app/api/recipes/[id]/tags/route.ts` — POST (add tag), DELETE (remove tag)
  - `src/app/api/recipes/[id]/save/route.ts` — POST (save), DELETE (unsave)
  - `src/lib/validations/tags.ts` — Zod schemas for tag and save operations
  - `src/components/recipes/tag-toggles.tsx` — Tag toggle button group (Favorite, To Try, Made Before)
  - `src/components/recipes/save-button.tsx` — Save/unsave toggle button
  - `src/hooks/use-tags.ts` — React Query mutation hooks with optimistic updates
  - Tests for all of the above

- **Relevant code**:
  - `prisma/schema.prisma` — `UserRecipeTag` model (unique on userId, recipeId, status), `SavedRecipe` model (unique on userId, recipeId)
  - `src/app/api/recipes/route.ts` — Pattern for API routes with auth, validation, Prisma queries
  - `src/hooks/use-recipes.ts` — Pattern for React Query hooks with mutations and cache invalidation
  - `src/lib/validations/recipe.ts` — Pattern for Zod schemas with inferred types
  - `src/components/recipes/recipe-detail/recipe-actions.tsx` — Pattern for action buttons on recipe detail page
  - `src/components/recipes/recipe-card.tsx` — Recipe card component where tag toggles will appear

---

## Desired Outcome

- **End state**: Users can toggle Favorite, To Try, and Made Before tags on any recipe they can view, and save/unsave recipes to their collection. Tags and saves are persisted via API routes and reflected instantly in the UI through optimistic updates.
- **User-facing changes**:
  - Three tag toggle buttons visible on recipe detail page and recipe cards: Heart (Favorite), Bookmark (To Try), Check (Made Before)
  - Each button shows filled/colored state when active, outline when inactive
  - A Save/Unsave button on recipe cards and recipe detail page
  - All toggles respond instantly (optimistic update), with rollback on error
  - Unauthenticated users see disabled or hidden tag/save buttons
- **Developer-facing changes**:
  - `src/app/api/recipes/[id]/tags/route.ts` — Tag CRUD API route
  - `src/app/api/recipes/[id]/save/route.ts` — Save/unsave API route
  - `src/lib/validations/tags.ts` — Zod schemas for tags and saves
  - `src/components/recipes/tag-toggles.tsx` — Tag toggle UI component
  - `src/components/recipes/save-button.tsx` — Save toggle UI component
  - `src/hooks/use-tags.ts` — React Query hooks for tags and saves
  - Updated `src/test/factories.ts` — Mock factories for tags and saves
  - Tests for API routes, hooks, and components in co-located `__tests__/` directories

---

## Scope & Boundaries

### In Scope

- Create Zod validation schema for tag operations (`{ status: TagStatus }`)
- Create `POST /api/recipes/[id]/tags` API route to add a tag
- Create `DELETE /api/recipes/[id]/tags` API route to remove a tag (accepts `{ status: TagStatus }` in the body)
- Create `POST /api/recipes/[id]/save` API route to save a recipe
- Create `DELETE /api/recipes/[id]/save` API route to unsave a recipe
- Create `TagToggles` client component with three independent toggle buttons
- Create `SaveButton` client component with save/unsave toggle
- Create React Query mutation hooks with optimistic updates for tags and saves
- Integrate `TagToggles` and `SaveButton` into the recipe detail page (`src/app/(main)/recipes/[id]/page.tsx`)
- Integrate `TagToggles` and `SaveButton` into the recipe card (`src/components/recipes/recipe-card.tsx`)
- Update test factories with tag and save mock data
- Write tests for API routes, hooks, and components

### Out of Scope

- My Collection page with tabs (task-6.2)
- Ratings and comments (Phase 8 — task-8.2)
- Sharing features (Phase 8 — task-8.1)
- Community page (Phase 8 — task-8.3)
- Guest access summary view (Phase 8 — task-8.3)
- Modifying the `GET /api/recipes` or `GET /api/recipes/[id]` routes (they already return tag/save data)

### Dependencies

- Recipe CRUD API routes complete (task-5.1 — done)
- Recipe detail page exists (task-5.4 — done)
- Recipe card and grid components exist (task-5.3 — done, via task-5.5)
- React Query hooks pattern established (task-5.5 — done)
- Auth utilities implemented (Phase 3 — done)

---

## Implementation Details

### Section 1: Tag Validation Schema (`src/lib/validations/tags.ts`)

**What to do**: Create Zod schemas for tag and save request bodies.

**Where to find context**:

- `src/lib/validations/recipe.ts` — Existing Zod pattern with inferred types
- `prisma/schema.prisma` — `TagStatus` enum values: `FAVORITE`, `TO_TRY`, `MADE_BEFORE`

**Specific requirements**:

1. **`addTagSchema`**:
   - `status`: z.enum matching `TagStatus` values (`'FAVORITE'`, `'TO_TRY'`, `'MADE_BEFORE'`)
   - Custom error message: `'Invalid tag status'`

2. **`removeTagSchema`**: Same shape as `addTagSchema` (used for DELETE body validation)

3. Export inferred types: `AddTagInput`, `RemoveTagInput`

**Patterns to follow**:

- Follow `src/lib/validations/auth.ts` — export schema + inferred type
- Import nothing from Prisma enums in validation files — use string literals in `z.enum()` to keep validations framework-agnostic

---

### Section 2: Tag API Route (`src/app/api/recipes/[id]/tags/route.ts`)

**What to do**: Create POST and DELETE handlers for adding and removing user recipe tags.

**Where to find context**:

- `docs/ROADMAP.md` (lines 606-607) — Tag API specs
- `docs/CTO_SPECS.md` — `UserRecipeTag` unique constraint `@@unique([userId, recipeId, status])`
- `src/app/api/recipes/[id]/route.ts` — Existing route pattern for `[id]` routes

**Specific requirements**:

**POST `/api/recipes/[id]/tags`** — Add a tag:

- Require authentication via `requireAuth()`
- Parse and validate body against `addTagSchema`
- Verify the recipe exists (return 404 if not)
- Create `UserRecipeTag` record with `{ userId, recipeId, status }`
- Handle duplicate constraint: if the tag already exists, return 200 with the existing tag (idempotent)
  - Use `prisma.userRecipeTag.upsert()` or catch Prisma unique constraint error (`P2002`)
- Return 201 with the created tag record on new creation
- Return 200 with the existing tag record if already exists

**DELETE `/api/recipes/[id]/tags`** — Remove a tag:

- Require authentication via `requireAuth()`
- Parse and validate body against `removeTagSchema`
- Delete the `UserRecipeTag` record matching `{ userId, recipeId, status }`
- If the tag doesn't exist, return 200 with `{ success: true }` (idempotent)
  - Use `prisma.userRecipeTag.deleteMany()` with the compound filter
- Return 200 with `{ success: true }`

**Patterns to follow**:

- Extract `id` from route params: `{ params }: { params: Promise<{ id: string }> }` (Next.js 15+ async params)
- Use `NextResponse.json()` for all responses
- Parse body with try/catch for invalid JSON
- Use `safeParse()` for Zod validation

---

### Section 3: Save API Route (`src/app/api/recipes/[id]/save/route.ts`)

**What to do**: Create POST and DELETE handlers for saving and unsaving recipes.

**Where to find context**:

- `docs/ROADMAP.md` (lines 608-610) — Save API specs
- `docs/CTO_SPECS.md` — `SavedRecipe` unique constraint `@@unique([userId, recipeId])`

**Specific requirements**:

**POST `/api/recipes/[id]/save`** — Save a recipe:

- Require authentication via `requireAuth()`
- Verify the recipe exists (return 404 if not)
- Create `SavedRecipe` record with `{ userId, recipeId }`
- Handle duplicate constraint: if already saved, return 200 (idempotent)
  - Use `prisma.savedRecipe.upsert()` or catch `P2002`
- Return 201 on new save, 200 if already saved

**DELETE `/api/recipes/[id]/save`** — Unsave a recipe:

- Require authentication via `requireAuth()`
- Delete the `SavedRecipe` record matching `{ userId, recipeId }`
- If not saved, return 200 (idempotent)
  - Use `prisma.savedRecipe.deleteMany()` with the compound filter
- Return 200 with `{ success: true }`

**Patterns to follow**:

- Same patterns as Section 2 (auth, params extraction, idempotent operations)

---

### Section 4: Tag Toggles Component (`src/components/recipes/tag-toggles.tsx`)

**What to do**: Create a client component with three independent toggle buttons for Favorite, To Try, and Made Before tags.

**Where to find context**:

- `docs/ROADMAP.md` (lines 611-616) — Tag toggle UI specs
- `src/components/recipes/recipe-detail/recipe-actions.tsx` — Existing action button patterns
- `src/components/ui/button.tsx` — shadcn/ui Button component
- `src/components/ui/tooltip.tsx` — shadcn/ui Tooltip component

**Specific requirements**:

1. **Props interface**:
   - `recipeId: string` — The recipe to tag
   - `initialTags: TagStatus[]` — Currently active tag statuses (from API response `userTags`)
   - `variant?: 'compact' | 'full'` — `compact` for recipe cards (icon only), `full` for detail page (icon + label)
   - `disabled?: boolean` — For unauthenticated users

2. **Three toggle buttons**, each independently toggleable:
   - **Favorite**: `Heart` icon from lucide-react, red fill when active, outline when inactive. Label: "Favorite"
   - **To Try**: `Bookmark` icon, yellow/amber fill when active, outline when inactive. Label: "To Try"
   - **Made Before**: `CheckCircle` icon, green fill when active, outline when inactive. Label: "Made Before"

3. **Behavior**:
   - Each button calls `useToggleTag()` hook on click
   - Optimistic toggle: UI updates immediately before API response
   - On error: revert to previous state + show error toast
   - `compact` variant: icon-only buttons with tooltip, smaller size
   - `full` variant: icon + text label, regular button size
   - When `disabled`: show buttons in muted state, no click handler

4. **Styling**:
   - Use shadcn/ui `Button` with `variant="ghost"` and `size="sm"` (compact) or `size="default"` (full)
   - Active state: filled icon with color class (`text-red-500`, `text-amber-500`, `text-green-500`)
   - Inactive state: outline icon with muted color
   - Wrap with `Tooltip` in compact variant

**Patterns to follow**:

- `'use client'` directive at top
- Named export (not default)
- Follow `src/components/recipes/recipe-detail/recipe-actions.tsx` for button layout patterns

---

### Section 5: Save Button Component (`src/components/recipes/save-button.tsx`)

**What to do**: Create a client component for saving/unsaving a recipe.

**Where to find context**:

- `docs/ROADMAP.md` (lines 617-618) — Save button specs
- `src/components/recipes/recipe-detail/recipe-actions.tsx` — Existing action button pattern

**Specific requirements**:

1. **Props interface**:
   - `recipeId: string`
   - `initialSaved: boolean` — From API response `isSaved`
   - `variant?: 'compact' | 'full'` — Same as TagToggles
   - `disabled?: boolean`

2. **Visual states**:
   - Saved: `BookmarkCheck` icon (filled), "Saved" label, primary/accent color
   - Not saved: `BookmarkPlus` icon (outline), "Save" label, muted color

3. **Behavior**:
   - Calls `useToggleSave()` hook on click
   - Optimistic update: toggle immediately
   - On error: revert + error toast
   - Show toast on save: "Recipe saved to collection"
   - Show toast on unsave: "Recipe removed from collection"

**Patterns to follow**:

- Same component patterns as Section 4

---

### Section 6: React Query Hooks (`src/hooks/use-tags.ts`)

**What to do**: Create React Query mutation hooks with optimistic updates for tag and save operations.

**Where to find context**:

- `src/hooks/use-recipes.ts` — Existing hook pattern (fetcher functions, mutation with toast and cache invalidation)
- `docs/ROADMAP.md` (lines 619-622) — Hook requirements

**Specific requirements**:

1. **Fetcher functions** (co-located at top of file):
   - `addTag(recipeId: string, status: TagStatus)` — POST to `/api/recipes/[id]/tags`
   - `removeTag(recipeId: string, status: TagStatus)` — DELETE to `/api/recipes/[id]/tags`
   - `saveRecipe(recipeId: string)` — POST to `/api/recipes/[id]/save`
   - `unsaveRecipe(recipeId: string)` — DELETE to `/api/recipes/[id]/save`

2. **`useToggleTag()`** mutation hook:
   - Accepts: `{ recipeId: string, status: TagStatus, isActive: boolean }`
   - If `isActive` is true, call `removeTag`; if false, call `addTag`
   - **Optimistic update**: In `onMutate`:
     - Cancel outgoing queries for `['recipe', recipeId]` and `['recipes']`
     - Snapshot previous cache data
     - Update the cached recipe's `userTags` array (add or remove the status)
     - Return the snapshot for rollback
   - **On error**: Revert cache to snapshot from `context`
   - **On settled**: Invalidate `['recipe', recipeId]` and `['recipes']` queries

3. **`useToggleSave()`** mutation hook:
   - Accepts: `{ recipeId: string, isSaved: boolean }`
   - If `isSaved` is true, call `unsaveRecipe`; if false, call `saveRecipe`
   - **Optimistic update**: Same pattern — update `isSaved` in cache
   - On success toast: "Recipe saved to collection" / "Recipe removed from collection"
   - On error: revert + error toast
   - On settled: invalidate relevant queries

**Patterns to follow**:

- Follow `src/hooks/use-recipes.ts` — co-located fetchers, named hook exports, `useQueryClient()` for cache operations
- Use `queryClient.setQueryData()` for optimistic cache updates
- Use `queryClient.cancelQueries()` before optimistic updates
- Use `queryClient.invalidateQueries()` in `onSettled`

---

### Section 7: Integration into Recipe Detail Page

**What to do**: Add `TagToggles` and `SaveButton` components to the recipe detail page.

**Where to find context**:

- `src/app/(main)/recipes/[id]/page.tsx` — Recipe detail page (server component)
- `src/components/recipes/recipe-detail/recipe-actions.tsx` — Existing actions area

**Specific requirements**:

1. Add `TagToggles` with `variant="full"` to the recipe detail page, near the action buttons area
2. Add `SaveButton` with `variant="full"` to the recipe detail page
3. Pass `initialTags` from the recipe's `userTags` array (map to `TagStatus[]`)
4. Pass `initialSaved` from the recipe's `isSaved` field
5. When user is not authenticated: pass `disabled={true}` to both components
6. Do not show tag/save buttons if the user is viewing their own recipe (owner doesn't need to save their own recipe — they already own it)

**Patterns to follow**:

- The detail page is a server component; `TagToggles` and `SaveButton` are client components — pass data as props

---

### Section 8: Integration into Recipe Card

**What to do**: Add compact tag toggles and save button to the recipe card component.

**Where to find context**:

- `src/components/recipes/recipe-card.tsx` — Recipe card component

**Specific requirements**:

1. Add `TagToggles` with `variant="compact"` to the recipe card (bottom area or as overlay icons)
2. Add `SaveButton` with `variant="compact"` to the recipe card
3. Pass `initialTags` and `initialSaved` from the `RecipeListItem` data
4. Ensure the card click-to-navigate still works (prevent event propagation from tag/save buttons)
5. When user is not authenticated (`userTags` undefined): hide the tag/save buttons entirely on cards
6. Handle the layout so buttons don't overlap the card's content

**Patterns to follow**:

- Use `e.preventDefault()` and `e.stopPropagation()` on tag/save button clicks to prevent card navigation

---

### Section 9: Update Test Factories

**What to do**: Add mock factories for tag and save related data.

**Where to find context**:

- `src/test/factories.ts` — Existing factory pattern

**Specific requirements**:

1. Add `createMockUserRecipeTag(overrides?)` — returns `{ id, userId, recipeId, status }` matching `UserRecipeTag` shape
2. Add `createMockSavedRecipe(overrides?)` — returns `{ id, userId, recipeId, savedAt }` matching `SavedRecipe` shape
3. Update `createMockRecipeListItem()` to optionally include `userTags` and `isSaved` fields

---

### Section 10: Tests

**What to do**: Write comprehensive tests for all new functionality.

**Where to find context**:

- `src/app/api/recipes/__tests__/route.test.ts` — Existing API route test pattern
- `src/hooks/__tests__/use-recipes.test.ts` — Existing hook test pattern
- `src/components/recipes/__tests__/recipe-card.test.tsx` — Existing component test pattern

**Specific requirements**:

**API Route Tests** (`src/app/api/recipes/[id]/tags/__tests__/route.test.ts`):

- POST: Add each tag status (FAVORITE, TO_TRY, MADE_BEFORE) — expect 201
- POST: Duplicate tag (idempotent) — expect 200
- POST: Invalid status value — expect 400
- POST: Unauthenticated — expect 401
- POST: Recipe not found — expect 404
- DELETE: Remove existing tag — expect 200
- DELETE: Remove non-existent tag (idempotent) — expect 200
- DELETE: Unauthenticated — expect 401

**API Route Tests** (`src/app/api/recipes/[id]/save/__tests__/route.test.ts`):

- POST: Save recipe — expect 201
- POST: Already saved (idempotent) — expect 200
- POST: Unauthenticated — expect 401
- POST: Recipe not found — expect 404
- DELETE: Unsave recipe — expect 200
- DELETE: Not saved (idempotent) — expect 200
- DELETE: Unauthenticated — expect 401

**Component Tests** (`src/components/recipes/__tests__/tag-toggles.test.tsx`):

- Renders all three buttons in both compact and full variants
- Active tag shows filled icon
- Inactive tag shows outline icon
- Click toggles tag state (optimistic)
- Disabled state renders correctly

**Component Tests** (`src/components/recipes/__tests__/save-button.test.tsx`):

- Renders saved and unsaved states correctly
- Click toggles save state
- Disabled state renders correctly

**Patterns to follow**:

- Use `vi.mock()` and `vi.hoisted()` for mocking
- Use MSW handlers or direct mock for fetch calls
- Use Testing Library for component rendering and assertions
- Follow co-located `__tests__/` directory pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] `POST /api/recipes/[id]/tags` with `{ status: "FAVORITE" }` creates a tag and returns 201
- [ ] `POST /api/recipes/[id]/tags` with duplicate tag returns 200 (idempotent)
- [ ] Multiple different tags can coexist on the same recipe for the same user
- [ ] `DELETE /api/recipes/[id]/tags` with `{ status: "FAVORITE" }` removes only that tag
- [ ] `POST /api/recipes/[id]/save` saves a recipe and returns 201
- [ ] `DELETE /api/recipes/[id]/save` unsaves a recipe and returns 200
- [ ] TagToggles component shows filled icons for active tags
- [ ] TagToggles component shows outline icons for inactive tags
- [ ] Clicking a tag button triggers optimistic UI update
- [ ] SaveButton toggles between saved/unsaved states
- [ ] Tag and save buttons are hidden/disabled for unauthenticated users
- [ ] Tag and save buttons prevent event propagation on recipe cards (card navigation still works)
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Enums imported from `@/generated/prisma/client` in runtime code
- [ ] Zod schemas use string literals (not Prisma enum imports)
- [ ] Optimistic updates include proper rollback on error

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

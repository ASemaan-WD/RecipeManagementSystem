---
task_id: 'task-10.2'
title: 'Shopping List Feature'
phase: 10
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.4'
  - 'task-5.5'
  - 'task-5.7'
blocks:
  - 'task-11.2'
created_at: '2026-02-22'
---

# Shopping List Feature

## Current State

> The database models for shopping lists exist in the Prisma schema, and the "Shopping Lists" navigation link is present in the header. However, no API routes, pages, components, hooks, or validation schemas exist for the shopping list feature.

- **What exists**:
  - Prisma `ShoppingList` model at `prisma/schema.prisma:273-283` with `id`, `name`, `userId`, `items[]`, `createdAt`, `updatedAt`, indexed on `[userId]`
  - Prisma `ShoppingListItem` model at `prisma/schema.prisma:285-294` with `id`, `shoppingListId`, `ingredientName`, `quantity`, `category`, `checked`, `order`, cascade delete on parent
  - `User.shoppingLists ShoppingList[]` relation at `prisma/schema.prisma:53`
  - "Shopping Lists" navigation link in header at `src/components/layout/header.tsx`
  - Recipe detail page at `src/app/(main)/recipes/[id]/page.tsx` with full ingredients data
  - `RecipeDetail['ingredients']` type at `src/types/recipe.ts:83-89` with `name`, `quantity`, `order`
  - Auth utilities at `src/lib/auth-utils.ts` (`getCurrentUser`, `requireAuth`)
  - Existing validation schemas in `src/lib/validations/` as patterns to follow
  - Existing API route patterns in `src/app/api/recipes/` as patterns to follow
  - Existing hooks in `src/hooks/` as patterns to follow
- **What is missing**:
  - All API routes: `/api/shopping-lists`, `/api/shopping-lists/[id]`, `/api/shopping-lists/[id]/items`
  - Validation schemas for shopping list create/update and item operations
  - Shopping list pages: `/shopping-lists` (index) and `/shopping-lists/[id]` (detail)
  - Components: `shopping-list.tsx`, `add-to-list-button.tsx`
  - Hook: `use-shopping-lists.ts`
  - Tests for all of the above
- **Relevant code**:
  - `prisma/schema.prisma:273-294` — ShoppingList and ShoppingListItem models
  - `src/lib/auth-utils.ts` — `requireAuth()` pattern for API route protection
  - `src/lib/validations/recipe.ts` — existing validation schema pattern
  - `src/hooks/use-recipes.ts` — existing React Query hook pattern
  - `src/app/api/recipes/route.ts` — existing API route pattern
  - `src/types/recipe.ts:83-89` — `RecipeDetail['ingredients']` for add-to-list data

---

## Desired Outcome

- **End state**: Users can create, view, edit, and delete shopping lists. They can add ingredients from recipes to a shopping list (with smart aggregation of duplicates). Each list shows items grouped by category with checkboxes. Items can be added manually, checked/unchecked, edited, and deleted.
- **User-facing changes**:
  - "Shopping Lists" nav link leads to `/shopping-lists` page showing all user's lists
  - "Create Shopping List" button to create a new empty or recipe-populated list
  - Individual list page at `/shopping-lists/[id]` with checklist UI grouped by category
  - "Add to Shopping List" button on recipe detail page to add recipe ingredients to a list
  - Items show checkboxes with strikethrough on checked
  - Manual item add, edit quantity, remove item
  - Delete list with confirmation
- **Developer-facing changes**:
  - New file: `src/lib/validations/shopping-list.ts` — Zod schemas
  - New file: `src/app/api/shopping-lists/route.ts` — GET (list) and POST (create)
  - New file: `src/app/api/shopping-lists/[id]/route.ts` — GET (detail), PUT (update name), DELETE
  - New file: `src/app/api/shopping-lists/[id]/items/route.ts` — POST (add item)
  - New file: `src/app/api/shopping-lists/[id]/items/[itemId]/route.ts` — PUT (toggle/edit), DELETE
  - New file: `src/components/shopping/shopping-list.tsx` — checklist UI component
  - New file: `src/components/shopping/add-to-list-button.tsx` — button for recipe detail
  - New file: `src/app/(main)/shopping-lists/page.tsx` — index page
  - New file: `src/app/(main)/shopping-lists/[id]/page.tsx` — detail page
  - New file: `src/hooks/use-shopping-lists.ts` — React Query hooks
  - New tests in co-located `__tests__/` directories

---

## Scope & Boundaries

### In Scope

- Validation schemas for shopping list CRUD and item operations
- API routes for shopping list CRUD (create, read, update name, delete)
- API routes for item operations (add, toggle checked, edit quantity, delete)
- Ingredient aggregation logic: combining duplicate ingredients across recipes (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour")
- Category assignment: static mapping of common ingredient names to categories (produce, dairy, pantry, proteins, spices, baking, other)
- Shopping list index page with list of user's lists
- Shopping list detail page with categorized checklist UI
- "Add to Shopping List" button on recipe detail page (select existing list or create new)
- React Query hooks for all operations
- Tests for API routes, components, hooks

### Out of Scope

- Recipe scaling (Task 10.1) — shopping list uses original quantities
- Print view (Task 10.3)
- Sharing shopping lists with other users
- Real-time collaborative editing of shopping lists
- Offline support / service worker caching
- Export to external apps
- Barcode scanning
- Price tracking or store integration

### Dependencies

- Task 2.4 (ShoppingList/ShoppingListItem Prisma models) — **verified: complete, models exist in schema**
- Task 5.5 (Recipe detail page) — **verified: complete, integration point for add-to-list button**
- Task 5.7 (React Query hooks) — **verified: complete, pattern to follow**

---

## Implementation Details

### Section 1: Validation Schemas

**What to do**: Create `src/lib/validations/shopping-list.ts` with Zod schemas for all shopping list operations.

**Where to find context**:

- `src/lib/validations/recipe.ts` — existing validation schema pattern
- `prisma/schema.prisma:273-294` — model fields and constraints
- `.claude/validation-schema-skill.md` — canonical pattern

**Specific requirements**:

- `createShoppingListSchema`: `{ name: string (1-200 chars, required), recipeIds?: string[] (optional, for auto-populating from recipes) }`
- `updateShoppingListSchema`: `{ name: string (1-200 chars, required) }`
- `addItemSchema`: `{ ingredientName: string (1-200 chars, required), quantity?: string, category?: string }`
- `updateItemSchema`: `{ checked?: boolean, quantity?: string, ingredientName?: string, category?: string }`
- `addFromRecipeSchema`: `{ recipeId: string (required) }` — for the add-to-list-from-recipe flow
- All schemas use custom Zod error messages
- Export inferred TypeScript types from each schema

**Patterns to follow**:

- Three-layer structure: field schemas → form/request schemas → inferred types
- Follow `.claude/validation-schema-skill.md` conventions

---

### Section 2: Shopping List API Routes

**What to do**: Create all API routes for shopping list and item CRUD operations.

**Where to find context**:

- `src/app/api/recipes/route.ts` — existing API route pattern (auth, validation, error handling)
- `src/lib/auth-utils.ts` — `requireAuth()` usage
- `.claude/api-route-skill.md` — canonical API route pattern

**Specific requirements**:

**`src/app/api/shopping-lists/route.ts`**:

- **GET**: List user's shopping lists (require auth). Return `{ id, name, itemCount, checkedCount, createdAt, updatedAt }[]` sorted by `updatedAt desc`. Include item counts via `_count` or aggregation.
- **POST**: Create shopping list (require auth). Validate body with `createShoppingListSchema`. If `recipeIds` provided, fetch all recipe ingredients, aggregate duplicates, assign categories, and create items. Return the created list with items.

**`src/app/api/shopping-lists/[id]/route.ts`**:

- **GET**: Get shopping list detail (require auth + ownership). Return list with all items sorted by `category` then `order`. Include all item fields.
- **PUT**: Update list name (require auth + ownership). Validate body with `updateShoppingListSchema`.
- **DELETE**: Delete shopping list (require auth + ownership). Cascade deletes items via Prisma schema.

**`src/app/api/shopping-lists/[id]/items/route.ts`**:

- **POST**: Add item to list (require auth + list ownership). Validate body with `addItemSchema`. Auto-assign category if not provided using the static category mapping.

**`src/app/api/shopping-lists/[id]/items/[itemId]/route.ts`**:

- **PUT**: Update item (require auth + list ownership). Validate body with `updateItemSchema`. Support partial updates (checked toggle, quantity edit, name edit).
- **DELETE**: Delete item (require auth + list ownership).

**Ingredient aggregation logic** (for POST create with recipeIds):

- For each recipe, fetch `RecipeIngredient` with ingredient name and quantity
- Group by normalized ingredient name (case-insensitive)
- If quantities can be parsed and have the same unit, sum them (reuse `parseQuantity` from `src/lib/scaling.ts` if Task 10.1 is complete; otherwise, store concatenated like "2 cups + 1 cup")
- Assign category from static mapping

**Static category mapping** (create as a constant in the route or a small utility):

```
produce: tomato, lettuce, onion, garlic, pepper, carrot, celery, potato, spinach, broccoli, ...
dairy: milk, cheese, cream, butter, yogurt, sour cream, ...
proteins: chicken, beef, pork, fish, salmon, shrimp, tofu, eggs, ...
pantry: rice, pasta, flour, sugar, salt, oil, vinegar, soy sauce, ...
spices: pepper, cinnamon, cumin, paprika, oregano, basil, thyme, ...
baking: baking powder, baking soda, vanilla, yeast, cocoa, ...
other: (default fallback)
```

**All routes must**:

- Use `requireAuth()` for authentication
- Verify shopping list ownership (list.userId === session.user.id) before any operation
- Return proper HTTP status codes (201 created, 200 ok, 404 not found, 403 forbidden)
- Use `safeParse()` for Zod validation with 400 status for invalid data

**Patterns to follow**:

- Follow `.claude/api-route-skill.md` — auth guard, Zod safeParse, Prisma error handling, consistent response format

---

### Section 3: React Query Hooks

**What to do**: Create `src/hooks/use-shopping-lists.ts` with React Query hooks for all operations.

**Where to find context**:

- `src/hooks/use-recipes.ts` — existing hook pattern with queries and mutations
- `src/hooks/use-tags.ts` — existing mutation pattern with optimistic updates
- `.claude/custom-hook-skill.md` — canonical hook pattern

**Specific requirements**:

- `useShoppingLists()`: query for list index (`GET /api/shopping-lists`)
- `useShoppingList(id)`: query for list detail (`GET /api/shopping-lists/[id]`)
- `useCreateShoppingList()`: mutation, invalidates list index on success
- `useUpdateShoppingList()`: mutation, invalidates list index and detail on success
- `useDeleteShoppingList()`: mutation, invalidates list index, redirects to index page
- `useAddItem()`: mutation, invalidates list detail on success
- `useUpdateItem()`: mutation with optimistic update for checked toggle (instant feedback), invalidates list detail
- `useDeleteItem()`: mutation, invalidates list detail on success
- `useAddRecipeToList(listId, recipeId)`: mutation that calls POST with recipeId to populate from recipe

**Patterns to follow**:

- Co-located fetcher functions in the same file
- Query key convention: `['shopping-lists']`, `['shopping-lists', id]`
- Follow `.claude/custom-hook-skill.md` conventions

---

### Section 4: Shopping List Components

**What to do**: Create the checklist UI component and the add-to-list button for recipe detail.

**Where to find context**:

- `src/components/recipes/tag-toggles.tsx` — example of interactive recipe action component
- `src/components/recipes/save-button.tsx` — example of recipe action button with optimistic update
- `.claude/client-component-skill.md` — canonical client component pattern

**Specific requirements**:

**`src/components/shopping/shopping-list.tsx`**:

- Props: `listId: string`, `items: ShoppingListItem[]` (typed from API response)
- Display items grouped by `category` with category headers
- Each item: checkbox, ingredient name, quantity, edit/delete buttons
- Checked items: strikethrough, muted color, sorted to bottom of category group
- "Add Item" row at bottom: inline form with ingredient name, optional quantity
- "Remove Checked" button to delete all checked items (with confirmation)
- Empty state: "No items yet. Add items or populate from a recipe."
- Use shadcn/ui `Checkbox`, `Button`, `Input`, `Card`
- Optimistic updates on check toggle (instant visual feedback)

**`src/components/shopping/add-to-list-button.tsx`**:

- Props: `recipeId: string`, `recipeName: string`
- Button opens a dialog/popover with:
  - List of user's existing shopping lists (fetched via `useShoppingLists`)
  - Click a list to add recipe ingredients to it
  - "Create New List" option that creates a new list populated with recipe ingredients
- Success toast: "Added ingredients from {recipeName} to {listName}"
- Use shadcn/ui `Button`, `Dialog`, `ScrollArea`

**Patterns to follow**:

- `'use client'` directive on both components
- Follow `.claude/client-component-skill.md` conventions

---

### Section 5: Shopping List Pages

**What to do**: Create the shopping list index and detail pages.

**Where to find context**:

- `src/app/(main)/my-recipes/page.tsx` — existing list page pattern
- `src/app/(main)/my-collection/page.tsx` — existing page with dynamic data
- `.claude/page-component-skill.md` — canonical page pattern

**Specific requirements**:

**`src/app/(main)/shopping-lists/page.tsx`**:

- Server component with metadata: `{ title: "Shopping Lists" }`
- Renders a client wrapper component that uses `useShoppingLists()` hook
- Display as card list: each card shows list name, item count (X/Y checked), last updated
- Click card navigates to `/shopping-lists/[id]`
- "Create Shopping List" button (opens dialog: name input + optional recipe selection)
- Delete button per list (with confirmation dialog)
- Empty state: "You don't have any shopping lists yet. Create one to get started!"
- Loading state: skeleton cards

**`src/app/(main)/shopping-lists/[id]/page.tsx`**:

- Server component with dynamic metadata from list name
- Fetch list data server-side, pass to client `ShoppingList` component
- Back button to `/shopping-lists`
- List name as heading (editable inline or via edit button)
- Render `ShoppingList` component with items
- "Add to List from Recipe" button (optional, opens recipe picker)

**Patterns to follow**:

- Follow `.claude/page-component-skill.md` conventions
- Server component fetches initial data, client component handles interactivity

---

### Section 6: Integration into Recipe Detail Page

**What to do**: Add the "Add to Shopping List" button to the recipe detail page.

**Where to find context**:

- `src/app/(main)/recipes/[id]/page.tsx` (lines 213-236) — action buttons area
- `src/components/recipes/recipe-detail/recipe-actions.tsx` — existing actions component

**Specific requirements**:

- Add `AddToListButton` in the recipe detail page actions area, visible to authenticated users
- Pass `recipeId` and `recipeName` as props
- Position it alongside existing action buttons (share, tag, save)

**Patterns to follow**:

- Follow the existing integration pattern used by `TagToggles` and `SaveButton` in the recipe detail page

---

### Section 7: Tests

**What to do**: Write tests for API routes, components, and hooks.

**Where to find context**:

- `src/test/setup.ts` — test setup
- `src/test/factories.ts` — mock data factories
- `src/mocks/handlers.ts` — MSW handlers
- `.claude/test-file-skill.md` — canonical test pattern

**Specific requirements**:

**API Route Tests** (co-located in `__tests__/` directories):

- `src/app/api/shopping-lists/__tests__/route.test.ts`:
  - GET: returns user's lists with item counts, requires auth, returns empty array for no lists
  - POST: creates list with valid data, creates list with recipeIds (ingredient aggregation), validates body, requires auth
- `src/app/api/shopping-lists/[id]/__tests__/route.test.ts`:
  - GET: returns list with items, 404 for non-existent, 403 for non-owner
  - PUT: updates name, validates body
  - DELETE: deletes list, 403 for non-owner
- `src/app/api/shopping-lists/[id]/items/__tests__/route.test.ts`:
  - POST: adds item, assigns category automatically, validates body
- `src/app/api/shopping-lists/[id]/items/[itemId]/__tests__/route.test.ts`:
  - PUT: toggles checked, edits quantity
  - DELETE: removes item

**Component Tests**:

- `src/components/shopping/__tests__/shopping-list.test.tsx`: renders items grouped by category, check/uncheck toggles, add item form, remove checked
- `src/components/shopping/__tests__/add-to-list-button.test.tsx`: opens dialog, shows existing lists, creates new list

**Add mock factories**: `createMockShoppingList()` and `createMockShoppingListItem()` to `src/test/factories.ts`
**Add MSW handlers**: shopping list endpoints to `src/mocks/handlers.ts`

**Patterns to follow**:

- Follow `.claude/test-file-skill.md` conventions
- Use `vi.mock()` for auth module, MSW for HTTP mocking

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] Shopping list index page shows all user's lists with item counts
- [ ] Creating a shopping list from scratch works (name only)
- [ ] Creating a shopping list from recipe IDs aggregates ingredients correctly
- [ ] Duplicate ingredients across recipes are combined (e.g., "2 cups flour" + "1 cup flour")
- [ ] Items are grouped by category (produce, dairy, pantry, etc.)
- [ ] Checking an item applies strikethrough and muted styling
- [ ] Adding an item manually works with inline form
- [ ] Editing item quantity updates the value
- [ ] Deleting an item removes it from the list
- [ ] "Remove Checked" clears all checked items
- [ ] Deleting a shopping list removes it and its items
- [ ] "Add to Shopping List" button on recipe detail adds ingredients to selected list
- [ ] Creating a new list from recipe detail pre-populates with recipe ingredients
- [ ] Non-owner cannot access another user's shopping list (403)
- [ ] All operations require authentication (401 for unauthenticated)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] All API routes use `safeParse()` for Zod validation
- [ ] All API routes verify ownership before operations

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

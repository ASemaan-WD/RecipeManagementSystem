# Phase 5: Recipe CRUD Operations — Implementation Plan

## Context

Phase 5 adds the complete recipe lifecycle to the application — types, validation, API routes, form wizard, display components, pages, and tests. This is the core feature phase that enables users to create, view, edit, delete, and duplicate recipes. Phases 1-4 (scaffolding, database, auth, layout) are complete and provide the foundation.

**6 tasks in strict dependency order:**

- **Task 5.1** (foundation) → blocks 5.2, 5.3, 5.4, 5.5, 5.6
- **Task 5.2** (form wizard) + **Task 5.3** (card/grid) → can run in parallel after 5.1
- **Task 5.4** (detail page) → depends on 5.1 + 5.3
- **Task 5.5** (pages + hooks) → depends on 5.1 + 5.2 + 5.3 + 5.4
- **Task 5.6** (tests) → depends on all above

**Estimated new files: ~40+**

---

## Existing Code to Reuse

| Utility                | Location                                                     | Usage                                                  |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| `requireAuth()`        | [auth-utils.ts](src/lib/auth-utils.ts)                       | Auth guard in all protected API routes                 |
| `requireRecipeOwner()` | [auth-utils.ts](src/lib/auth-utils.ts)                       | Ownership check for PUT/DELETE                         |
| `canViewRecipe()`      | [auth-utils.ts](src/lib/auth-utils.ts)                       | Visibility check for GET detail + duplicate            |
| `getCurrentUser()`     | [auth-utils.ts](src/lib/auth-utils.ts)                       | Optional auth in GET list                              |
| `prisma`               | [db.ts](src/lib/db.ts)                                       | Database client singleton                              |
| `cn()`                 | [utils.ts](src/lib/utils.ts)                                 | Tailwind class merging                                 |
| Prisma enums           | [generated/prisma/client](src/generated/prisma/client)       | `Difficulty`, `Visibility`, `ImageSource`, `TagStatus` |
| Zod pattern            | [validations/auth.ts](src/lib/validations/auth.ts)           | Three-layer schema structure                           |
| API route pattern      | [auth/username/route.ts](src/app/api/auth/username/route.ts) | Auth guard + body parse + safeParse + Prisma errors    |
| Factory pattern        | [factories.ts](src/test/factories.ts)                        | `createMock<Entity>(overrides)`                        |
| MSW handlers           | [handlers.ts](src/mocks/handlers.ts)                         | `http.get/post()` + `HttpResponse.json()`              |
| Page pattern           | [dashboard/page.tsx](<src/app/(main)/dashboard/page.tsx>)    | Server component + auth + metadata                     |
| Schema                 | [schema.prisma](prisma/schema.prisma)                        | All recipe models (lines 102-294)                      |

---

## Task 5.1: Recipe Types, Validation Schemas & API Routes

> Foundation task — blocks everything else. Creates the complete data layer.

### Step 1: Create `src/types/recipe.ts`

8 type definitions. Import enums from `@/generated/prisma/client`. Named exports only.

1. **`RecipeIngredientInput`** — `{ name, quantity, unit?, notes?, order }`
2. **`RecipeStepInput`** — `{ instruction, duration?, stepNumber }`
3. **`RecipeImageInput`** — `{ url, source: ImageSource, isPrimary, order }`
4. **`RecipeFormData`** — full form shape aggregating above + recipe metadata + `dietaryTagIds: string[]`
5. **`RecipeListItem`** — card display shape with nested `author: { id, name, username, image }`, `primaryImage: { url } | null`, `dietaryTags: { id, name }[]`, optional `userTags?`, `isSaved?`
6. **`RecipeDetail`** — extends list item with full `images[]`, `ingredients[]`, `steps[]`, `nutritionData`, `updatedAt`
7. **`RecipeFilters`** — all filter/sort/pagination params as optional fields
8. **`PaginatedResponse<T>`** — generic `{ data: T[], pagination: { total, page, pageSize, totalPages } }`

### Step 2: Create `src/lib/validations/recipe.ts`

Three-layer Zod structure following `src/lib/validations/auth.ts` pattern:

**Field schemas** → **Form schemas** → **Inferred types**

- **`createRecipeSchema`**: name (1-200, trimmed), description (1-2000, trimmed), prepTime (positive int), cookTime (positive int), servings (1-100), difficulty (`z.nativeEnum(Difficulty)`), cuisineType (1-50, trimmed), visibility (default PRIVATE), ingredients (min 1 item array), steps (min 1 item array), dietaryTagIds (default []), images (default [])
- **`updateRecipeSchema`**: all fields optional (partial of create). When arrays provided, they replace fully (not merge)
- **`recipeFilterSchema`**: `z.coerce.number()` for numeric query params, defaults: page=1, limit=12 (max 50), sort='newest'
- Export inferred types: `CreateRecipeInput`, `UpdateRecipeInput`, `RecipeFilterInput`

### Step 3: Create `src/lib/cloudinary.ts`

```
generateUploadSignature() → { signature, timestamp, cloudName, apiKey, folder }
CLOUDINARY_FOLDER = 'recipe-management/recipes'
```

- Uses Node.js `crypto.createHash('sha1')` for SHA-1 signature
- Reads env vars at call time (not module level)

### Step 4: Create `src/app/api/recipes/route.ts` — GET + POST

**GET** (list with filters):

1. Optional auth via `getCurrentUser()`
2. Parse query params with `recipeFilterSchema.safeParse()`
3. Build Prisma `where`: authenticated → own + public recipes; unauth → public only. Apply filters: `contains` on name/description, cuisine, difficulty, prepTime/cookTime lte, dietary tag filter, minRating
4. Build `orderBy` from sort param (newest/oldest/rating/prepTime/title)
5. Use `prisma.recipe.findMany()` with `select` (lean response) + `skip`/`take` for pagination
6. Return `PaginatedResponse<RecipeListItem>` with pagination metadata

**POST** (create):

1. `requireAuth()` guard
2. Body parse + `createRecipeSchema.safeParse()`
3. **Prisma `$transaction()`** for atomicity:
   - Create Recipe record
   - **Ingredient upsert pattern**: for each ingredient, `tx.ingredient.upsert({ where: { name: normalized }, update: {}, create: { name } })`, then create `RecipeIngredient` join record
   - `createMany` for steps, images
   - Validate dietary tag IDs exist, then `createMany` for `RecipeDietaryTag`
4. Re-fetch complete recipe with all relations
5. Return 201 with `RecipeDetail`

### Step 5: Create `src/app/api/recipes/[id]/route.ts` — GET + PUT + DELETE

**GET**: `canViewRecipe(id, shareToken)` → fetch full recipe with nested `select` → for auth users include userTags/savedBy

**PUT**: `requireRecipeOwner(id)` → `updateRecipeSchema.safeParse()` → **transaction with full array replacement**: if ingredients/steps/images/dietaryTagIds provided, delete all existing then create new → return updated recipe

**DELETE**: `requireRecipeOwner(id)` → `prisma.recipe.delete()` (cascade handles relations) → `{ success: true }`

### Step 6: Create `src/app/api/recipes/[id]/duplicate/route.ts` — POST

1. `requireAuth()` + `canViewRecipe(id)` for source access
2. Fetch source recipe with all relations
3. Transaction: create new recipe copying fields + " (Copy)" suffix, set new author, PRIVATE visibility, reset ratings
4. Copy all relations: ingredients (same `ingredientId` references), steps, images (reference copy), dietary tags

### Step 7: Create `src/app/api/images/[id]/route.ts` — DELETE

**Image ownership check chain**: Image → Recipe → authorId

1. `requireAuth()`
2. Find image with `include: { recipe: { select: { authorId: true } } }`
3. Check `image.recipe.authorId === session.user.id`
4. Delete the `RecipeImage` record

### Step 8: Create `src/app/api/images/upload-signature/route.ts` — POST

Simple: `requireAuth()` → `generateUploadSignature()` → return result

### Step 9: Update `src/test/factories.ts`

Add 5 new factories (keep existing ones unchanged):

- `createMockRecipeListItem(overrides?)` — includes nested author, primaryImage, dietaryTags
- `createMockRecipeDetail(overrides?)` — extends list item with full relations
- `createMockRecipeIngredient(overrides?)`
- `createMockRecipeStep(overrides?)`
- `createMockPaginatedResponse<T>(data, overrides?)` — wraps array with pagination

### Verification

- `npm run build` passes
- All types export correctly
- API routes return correct responses (manual test with curl)

---

## Task 5.2: Recipe Form Wizard & Image Upload

> Multi-step form with 5 steps. Can start after 5.1 completes. All files in `src/components/recipes/recipe-form/`.

### Step 1: Create `form-progress.tsx` (shared component, NO `'use client'`)

Props: `currentStep`, `totalSteps`, `stepLabels: string[]`

- Desktop: full step bar with connected dots/lines, labels
- Mobile: "Step X of Y" text
- Completed/active/pending styling via `cn()`

### Step 2: Create `recipe-form-wizard.tsx` (client component — main orchestrator)

```typescript
interface RecipeFormWizardProps {
  mode: 'create' | 'edit';
  defaultValues?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  isSubmitting?: boolean;
  dietaryTags: { id: string; name: string }[];
}
```

- `useForm()` with `zodResolver(createRecipeSchema)`
- `FormProvider` wraps step components
- Per-step validation via `trigger(STEP_FIELDS[currentStep])`
- STEP_FIELDS maps step index → field names for validation
- Previous/Next/Submit buttons with loading states

### Step 3: Create `basic-info-step.tsx` (client)

Uses `useFormContext()`. 8 fields: name (Input), description (Textarea + char count), prepTime/cookTime/servings (number Inputs), difficulty/visibility (Select), cuisineType (Input). Uses shadcn/ui `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`.

### Step 4: Create `ingredients-step.tsx` (client)

`useFieldArray({ name: 'ingredients' })`. Each row: name, quantity, notes inputs + remove button. "Add Ingredient" appends blank row with auto-incremented `order`. Min 1 required.

### Step 5: Create `steps-step.tsx` (client)

`useFieldArray({ name: 'steps' })`. Each row: auto-numbered display, instruction textarea, optional duration input + remove button. "Add Step" appends blank row. Re-numbers `stepNumber` on removal. Min 1 required.

### Step 6: Create `tags-step.tsx` (client)

Receives `dietaryTags` prop. Renders checkboxes using shadcn/ui `Checkbox`. Maps checked state to/from `dietaryTagIds` via `useFormContext()`. Optional step — no minimum.

### Step 7: Create `images-step.tsx` (client)

Three sources: URL input, Cloudinary upload widget, AI placeholder (disabled). `useFieldArray({ name: 'images' })`. Image preview grid with primary toggle (radio). Max 5 images. First image auto-set as primary.

### Step 8: Create `src/components/recipes/image-upload-widget.tsx` (client)

Wraps `CldUploadWidget` from `next-cloudinary`. Fetches signature from `/api/images/upload-signature`. Props: `onUpload: (result) => void`, `disabled?`. Styled as dropzone/button.

### Verification

- `npm run build` passes
- Wizard renders all 5 steps
- Step navigation with validation works
- Form data persists across steps

---

## Task 5.3: Recipe Card & Grid Components

> Display components for recipe listing. Can start after 5.1 completes (parallel with 5.2).

### Step 1: Create `src/components/recipes/recipe-card.tsx` (presentational)

Props: `recipe: RecipeListItem`. Wrapped in `<Link href="/recipes/${recipe.id}">`.

Layout (top to bottom):

1. Image: `next/image` with `primaryImage?.url` or fallback (food icon + gradient)
2. Title: 2-line truncate
3. Cuisine badge + Difficulty badge (green=EASY, amber=MEDIUM, red=HARD)
4. Time display: prep + cook + total
5. Rating: stars (read-only) + count or "No ratings"
6. Author: Avatar + name/username
7. Visibility icon (Lock/Users/Globe) — corner

Hover: `hover:scale-[1.02] hover:shadow-lg transition-all`

### Step 2: Create `src/components/recipes/recipe-card-skeleton.tsx` (shared, NO `'use client'`)

Matches card layout with animated `Skeleton` components.

### Step 3: Create `src/components/recipes/recipe-grid.tsx` (client for Load More interaction)

Props: `recipes`, `isLoading?`, `skeletonCount=8`, `emptyState?`, `hasMore?`, `onLoadMore?`

Grid: `grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

States: loading (skeletons), empty (centered message + CTA), data (cards), load more button.

### Verification

- `npm run build` passes
- Card displays all data, responsive across breakpoints
- Grid handles loading/empty/data/load-more states

---

## Task 5.4: Recipe Detail Page

> Full recipe display at `/recipes/[id]`. Depends on 5.1 + 5.3.

### Step 1: Create `src/app/(main)/recipes/[id]/page.tsx` (server page)

- `generateMetadata()` with recipe title/description
- Accept `params: Promise<{ id: string }>`, `searchParams: Promise<{ token?: string }>`
- Call `canViewRecipe(id, token)` server-side (direct Prisma, not API)
- If `NextResponse` returned → `notFound()`
- Fetch full recipe with all nested relations via Prisma `select`
- Determine `isOwner` (compare authorId with current user)
- Pass data to sub-components

### Step 2: Create `recipe-detail/recipe-hero.tsx` (shared)

Props: `images`, `recipeName`. Primary image or first by order. `next/image`, full-width, max-height capped, gradient overlay. Fallback placeholder.

### Step 3: Create `recipe-detail/recipe-metadata.tsx` (shared)

Props: `recipe: RecipeDetail`. Horizontal bar: prep/cook/total time, servings, difficulty badge (color-coded), cuisine badge. Icons from lucide-react.

### Step 4: Create `recipe-detail/recipe-ingredients.tsx` (client — needs useState for checkboxes)

Props: `ingredients`. Ordered by `order`. Checkbox + name + quantity + notes. Checked → strikethrough. Local state only.

### Step 5: Create `recipe-detail/recipe-steps.tsx` (shared)

Props: `steps`. Ordered by `stepNumber`. Large step number circle + instruction text + optional duration badge.

### Step 6: Create `recipe-detail/recipe-images.tsx` (client — Dialog for lightbox)

Props: `images`. Only renders if 2+ images. Horizontal scrollable thumbnails. Click opens `Dialog` with larger image.

### Step 7: Create `recipe-detail/recipe-actions.tsx` (client)

Props: `recipeId`, `isOwner`, `recipeName`. Buttons: Edit (owner only, Link), Delete (owner only, opens dialog), Duplicate (all users, API call + loading), Print (`window.print()`).

### Step 8: Create `recipe-detail/delete-recipe-dialog.tsx` (client)

Props: `recipeId`, `recipeName`, `open`, `onOpenChange`. shadcn/ui `AlertDialog`. Calls `DELETE /api/recipes/[id]`. Success → redirect `/my-recipes` + toast. Loading state.

### Step 9: Create `recipe-detail/nutrition-section.tsx` (shared)

Props: `nutritionData: Record<string, unknown> | null`. If null → render nothing. If exists → collapsible card with nutrition grid + AI disclaimer.

### Verification

- `npm run build` passes
- Page loads at `/recipes/[id]`
- 404 for non-existent/inaccessible recipes
- Owner actions visible only to owner
- Responsive layout, dark mode support

---

## Task 5.5: Recipe Pages & React Query Hooks

> Wires everything together. Depends on 5.1 + 5.2 + 5.3 + 5.4.

### Step 1: Create `src/hooks/use-recipes.ts`

Co-located fetcher functions + 6 exported hooks:

| Hook                   | Method                             | Query Key              | Cache Action                                      |
| ---------------------- | ---------------------------------- | ---------------------- | ------------------------------------------------- |
| `useRecipes(filters)`  | GET `/api/recipes`                 | `['recipes', filters]` | —                                                 |
| `useRecipe(id)`        | GET `/api/recipes/[id]`            | `['recipe', id]`       | enabled: `!!id`                                   |
| `useCreateRecipe()`    | POST `/api/recipes`                | —                      | invalidate `['recipes']`                          |
| `useUpdateRecipe()`    | PUT `/api/recipes/[id]`            | —                      | invalidate `['recipes']` + `['recipe', id]`       |
| `useDeleteRecipe()`    | DELETE `/api/recipes/[id]`         | —                      | invalidate `['recipes']`, remove `['recipe', id]` |
| `useDuplicateRecipe()` | POST `/api/recipes/[id]/duplicate` | —                      | invalidate `['recipes']`                          |

All mutations use `toast.success()`/`toast.error()` from `sonner`.

### Step 2: Create `src/app/(main)/recipes/new/page.tsx`

Server component fetches dietary tags via Prisma, renders client wrapper component that:

- Mounts `RecipeFormWizard` in create mode
- Wires `onSubmit` to `useCreateRecipe()`
- Redirects to `/recipes/[newRecipeId]` on success
- Breadcrumb/back link to `/my-recipes`

### Step 3: Create `src/app/(main)/recipes/[id]/edit/page.tsx`

Server component fetches recipe + dietary tags + ownership check. Renders client wrapper that:

- Transforms `RecipeDetail` → `RecipeFormData` (map ingredients/steps/images/tags)
- Mounts `RecipeFormWizard` in edit mode with `defaultValues`
- Wires `onSubmit` to `useUpdateRecipe(recipeId)`
- Redirects to `/recipes/[id]` on success
- Loading skeleton while fetching

### Step 4: Create `src/app/(main)/my-recipes/page.tsx`

Client component (needs hooks + URL state):

- `useRecipes()` with filters
- **Filter tabs**: All, Public, Shared, Private (set visibility filter, show counts)
- **Sort dropdown**: Newest, Oldest, Title A-Z
- `RecipeGrid` with `hasMore`/`onLoadMore` pagination
- "Create New Recipe" CTA → `/recipes/new`
- Per-tab empty states
- URL-driven state: `?tab=X&sort=Y` via `useSearchParams()`

### Verification

- `npm run build` passes
- Create flow: `/recipes/new` → fill wizard → submit → redirected to detail
- Edit flow: `/recipes/[id]/edit` → form pre-populated → submit → redirected
- My Recipes: filter tabs, sort, Load More all work
- Toast notifications on success/error

---

## Task 5.6: Write Tests for Recipe CRUD

> Comprehensive test coverage. Depends on all above tasks.

### Step 1: Update `src/mocks/handlers.ts`

Add 8 MSW handlers: GET/POST `/api/recipes`, GET/PUT/DELETE `/api/recipes/:id`, POST `/api/recipes/:id/duplicate`, DELETE `/api/images/:id`, POST `/api/images/upload-signature`. Happy path defaults; error scenarios overridden per-test.

### Step 2: `src/lib/validations/__tests__/recipe.test.ts`

Test all 3 schemas:

- `createRecipeSchema`: valid data, missing required fields, boundary values, nested array validation, defaults
- `updateRecipeSchema`: partial acceptance, empty object
- `recipeFilterSchema`: defaults, coercion, max limit, invalid sort

### Step 3: API Route Tests

**`src/app/api/recipes/__tests__/route.test.ts`**: GET (auth/unauth, filters, sorting, pagination), POST (valid create, 400 invalid, 401 unauth, ingredient upsert, transaction)

**`src/app/api/recipes/[id]/__tests__/route.test.ts`**: GET (owner/public/private/share token), PUT (valid update, 403, array replacement), DELETE (owner, 403)

**`src/app/api/recipes/[id]/duplicate/__tests__/route.test.ts`**: " (Copy)" suffix, new author, PRIVATE, relation copy, rating reset

**`src/app/api/images/__tests__/upload-signature.test.ts`**: auth required, valid signature

**`src/app/api/images/[id]/__tests__/route.test.ts`**: ownership via recipe, 403 non-owner, 404

### Step 4: Component Tests

**`src/components/recipes/__tests__/recipe-card.test.tsx`**: renders all data, fallback image, difficulty colors, visibility icons, link

**`src/components/recipes/__tests__/recipe-grid.test.tsx`**: card count, skeletons, empty state, load more

**`src/components/recipes/recipe-form/__tests__/recipe-form-wizard.test.tsx`**: step navigation, validation blocking, back nav, submit, edit mode

### Step 5: Hook Tests — `src/hooks/__tests__/use-recipes.test.ts`

`renderHook` with `QueryClientProvider`. MSW for API mocking. Test each hook: data, loading, error, cache invalidation on mutations.

### Verification

- `npm run test:run` — all new + existing tests pass
- `npm run build` — no errors

---

## Key Architectural Patterns

### Ingredient Upsert (Global Lookup Table)

The `Ingredient` model has a unique `name`. On recipe create/update, each ingredient name must be upserted:

```
tx.ingredient.upsert({ where: { name: normalized }, update: {}, create: { name } })
```

Then create `RecipeIngredient` join record linking recipe → ingredient with quantity/notes/order.

### Prisma Transaction for Multi-Table Writes

All recipe create/update/duplicate operations use `prisma.$transaction()`. If any step fails, everything rolls back.

### Form Wizard Step Validation

React Hook Form's `trigger(fieldNames)` validates specific fields per step. `STEP_FIELDS` maps step index → field names. Returns boolean + sets form errors.

### RecipeDetail → RecipeFormData Transformation

For edit mode: map `ingredients[].name` → `RecipeIngredientInput.name`, `dietaryTags[].id` → `dietaryTagIds[]`, null fields → defaults.

### Image Ownership Chain

Images → Recipe → Author. No direct `authorId` on images. Verify via `image.recipe.authorId`.

---

## Execution Order Summary

```
5.1 (types + validation + API routes + factories)
  ├── 5.2 (form wizard + image upload)     ← parallel
  └── 5.3 (card + grid components)         ← parallel
        └── 5.4 (detail page)
              └── 5.5 (pages + hooks)
                    └── 5.6 (tests)
```

After each task: `npm run build` to verify. After 5.6: `npm run test:run` for full suite.

---
task_id: 'task-5.1'
title: 'Create Recipe Types, Validation Schemas & API Routes'
phase: 5
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-2.2'
  - 'task-2.3'
  - 'task-2.6'
  - 'task-3.2'
blocks:
  - 'task-5.2'
  - 'task-5.3'
  - 'task-5.4'
  - 'task-5.5'
  - 'task-5.6'
created_at: '2026-02-20'
---

# Create Recipe Types, Validation Schemas & API Routes

## Current State

> The Prisma schema defines all recipe-related models. Auth utilities (`requireAuth`, `requireRecipeOwner`, `canViewRecipe`) are implemented. No recipe types, validation schemas, or API routes exist yet.

- **What exists**:
  - Complete Prisma schema with all recipe models (`prisma/schema.prisma`, lines 102-198)
  - Generated Prisma client at `src/generated/prisma` with enums: `Difficulty`, `Visibility`, `ImageSource`, `TagStatus`
  - Singleton Prisma client (`src/lib/db.ts`)
  - Auth utilities (`src/lib/auth-utils.ts`): `getCurrentUser()`, `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()`
  - Zod v4 validation pattern (`src/lib/validations/auth.ts`)
  - Type augmentation pattern (`src/types/next-auth.d.ts`)
  - Mock factories (`src/test/factories.ts`): `createMockUser()`, `createMockSession()`, `createMockRecipe()`
  - Environment variables for Cloudinary configured in `.env.local`
  - `next-cloudinary` package installed
- **What is missing**:
  - `src/types/recipe.ts` — TypeScript types for recipe data shapes
  - `src/lib/validations/recipe.ts` — Zod validation schemas for recipe create/update/filter
  - `src/lib/cloudinary.ts` — Cloudinary server-side utilities (signed upload)
  - `src/app/api/recipes/route.ts` — GET (list) + POST (create)
  - `src/app/api/recipes/[id]/route.ts` — GET (detail) + PUT (update) + DELETE
  - `src/app/api/recipes/[id]/duplicate/route.ts` — POST (duplicate recipe)
  - `src/app/api/images/[id]/route.ts` — DELETE (delete recipe image)
  - `src/app/api/images/upload-signature/route.ts` — POST (Cloudinary upload signature)
- **Relevant code**:
  - `prisma/schema.prisma` — Full data model (Recipe, RecipeImage, Ingredient, RecipeIngredient, RecipeStep, DietaryTag, RecipeDietaryTag)
  - `src/lib/auth-utils.ts` — Auth helpers to use in API routes
  - `src/lib/db.ts` — Prisma client instance
  - `src/lib/validations/auth.ts` — Zod pattern reference
  - `src/app/api/auth/username/route.ts` — Existing API route pattern reference

---

## Desired Outcome

- **End state**: Complete recipe data layer — types, validation, and all CRUD API routes functional and returning correct data.
- **User-facing changes**: None directly — API endpoints are accessible but no UI consumes them yet.
- **Developer-facing changes**:
  - `src/types/recipe.ts` — All recipe TypeScript types
  - `src/lib/validations/recipe.ts` — Zod schemas and inferred types
  - `src/lib/cloudinary.ts` — Cloudinary upload signature utility
  - 5 new API route files under `src/app/api/`
  - Updated `src/test/factories.ts` — Enhanced mock factories

---

## Scope & Boundaries

### In Scope

- Create `src/types/recipe.ts` with all recipe-related TypeScript types
- Create `src/lib/validations/recipe.ts` with Zod schemas for create, update, and filter
- Create `src/lib/cloudinary.ts` with server-side upload signature generation
- Create recipe CRUD API routes: list, create, get, update, delete, duplicate
- Create image management API routes: delete image, generate upload signature
- Update `src/test/factories.ts` with additional recipe mock factories

### Out of Scope

- React components / UI (tasks 5.2–5.5)
- React Query hooks (task-5.5)
- Tag/save/rating/comment API routes (Phase 6, Phase 8)
- Full-text search implementation (Phase 7 — the `GET /api/recipes` will use basic `contains` filtering, not tsvector)
- Test files (task-5.6)

### Dependencies

- Prisma schema complete and migrated (Phase 2 — done)
- Auth utilities implemented (Phase 3 — done)
- Cloudinary env vars configured (Phase 1 — done)

---

## Implementation Details

### Section 1: Recipe TypeScript Types (`src/types/recipe.ts`)

**What to do**: Create all TypeScript interfaces/types for recipe data throughout the application.

**Where to find context**:

- `prisma/schema.prisma` (lines 102-198) — Data model shapes
- `docs/ROADMAP.md` (lines 371-394) — Type requirements

**Specific requirements**:

1. **`RecipeIngredientInput`** — Form ingredient input:
   - `name: string`, `quantity: string`, `unit?: string`, `notes?: string`, `order: number`

2. **`RecipeStepInput`** — Form step input:
   - `instruction: string`, `duration?: number`, `stepNumber: number`

3. **`RecipeImageInput`** — Form image input:
   - `url: string`, `source: ImageSource`, `isPrimary: boolean`, `order: number`

4. **`RecipeFormData`** — Full form data shape:
   - `name`, `description`, `prepTime`, `cookTime`, `servings`, `difficulty`, `cuisineType`, `visibility`, `ingredients: RecipeIngredientInput[]`, `steps: RecipeStepInput[]`, `dietaryTagIds: string[]`, `images: RecipeImageInput[]`

5. **`RecipeListItem`** — Summary for card/grid display:
   - Core fields: `id`, `name`, `description`, `prepTime`, `cookTime`, `servings`, `difficulty`, `cuisineType`, `visibility`, `avgRating`, `ratingCount`, `createdAt` (ISO string)
   - Relations: `author: { id, name, username, image }`, `primaryImage: { url } | null`, `dietaryTags: { id, name }[]`
   - Optional auth fields: `userTags?: { status: TagStatus }[]`, `isSaved?: boolean`

6. **`RecipeDetail`** — Full recipe for detail page:
   - All `RecipeListItem` fields plus: `nutritionData`, `updatedAt`
   - Full relations: `images[]`, `ingredients[]` (with id, name, quantity, notes, order), `steps[]` (with id, stepNumber, instruction, duration)

7. **`RecipeFilters`** — Search/filter params:
   - `page?`, `limit?`, `search?`, `cuisine?`, `difficulty?`, `maxPrepTime?`, `maxCookTime?`, `dietary?: string[]`, `minRating?`, `sort?`, `visibility?`

8. **`PaginatedResponse<T>`** — Generic:
   - `data: T[]`, `pagination: { total, page, pageSize, totalPages }`

**Patterns to follow**:

- Import enums from `@/generated/prisma/client`
- Use `interface` for object shapes, `type` for unions
- Export all types as named exports

---

### Section 2: Recipe Validation Schemas (`src/lib/validations/recipe.ts`)

**What to do**: Create Zod v4 schemas for recipe create, update, and filter operations.

**Where to find context**:

- `docs/ROADMAP.md` (lines 378-394) — Validation requirements
- `src/lib/validations/auth.ts` — Existing Zod pattern

**Specific requirements**:

1. **`createRecipeSchema`**:
   - `name`: string, min 1, max 200, trimmed
   - `description`: string, min 1, max 2000, trimmed
   - `prepTime`: positive integer
   - `cookTime`: positive integer
   - `servings`: integer, min 1, max 100
   - `difficulty`: enum (EASY, MEDIUM, HARD)
   - `cuisineType`: string, min 1, max 50, trimmed
   - `visibility`: enum (PRIVATE, SHARED, PUBLIC), default PRIVATE
   - `ingredients`: array of `{ name: string (min 1, trimmed), quantity: string (trimmed), unit?: string, notes?: string (max 200), order: number (non-negative int) }`, min 1 item
   - `steps`: array of `{ instruction: string (min 1, max 5000, trimmed), duration?: positive integer, stepNumber: positive integer }`, min 1 item
   - `dietaryTagIds`: array of strings, optional, default `[]`
   - `images`: array of `{ url: string (URL format), source: ImageSource enum, isPrimary: boolean, order: non-negative int }`, optional, default `[]`

2. **`updateRecipeSchema`**: All fields from `createRecipeSchema` but optional. When `ingredients`, `steps`, or `images` are provided, they replace the full list (not merge).

3. **`recipeFilterSchema`**: For query string parsing:
   - Use `z.coerce.number()` for numeric string params
   - `page`: positive int, default 1
   - `limit`: int, min 1, max 50, default 12
   - `search`: string, max 200, optional
   - `cuisine`, `difficulty`, `maxPrepTime`, `maxCookTime`, `minRating`, `sort` (default 'newest'), `visibility` — all optional with appropriate validation

4. Export inferred types: `CreateRecipeInput`, `UpdateRecipeInput`, `RecipeFilterInput`

**Patterns to follow**:

- Follow `src/lib/validations/auth.ts` — export schema + inferred type
- Meaningful error messages on each rule

---

### Section 3: Cloudinary Utilities (`src/lib/cloudinary.ts`)

**What to do**: Create server-side utility for generating Cloudinary upload signatures.

**Where to find context**:

- `docs/ROADMAP.md` (lines 491-498) — Cloudinary integration requirements
- `.env.local` / `.env.example` — Environment variable names

**Specific requirements**:

1. Export `generateUploadSignature()` function:
   - Reads `CLOUDINARY_API_SECRET` from environment
   - Generates a timestamp
   - Creates a SHA-1 signature of the upload parameters (`timestamp`, `folder`, `upload_preset` if used)
   - Returns `{ signature, timestamp, cloudName, apiKey }` for client-side upload widget

2. Export Cloudinary config constants:
   - `CLOUDINARY_FOLDER`: folder path for recipe images (e.g., `'recipe-management/recipes'`)

**Patterns to follow**:

- Use Node.js `crypto` module for SHA-1 signature
- Read env vars at function call time (not module level) for testability
- Follow the Cloudinary signed upload documentation

---

### Section 4: Recipe List & Create API Route (`src/app/api/recipes/route.ts`)

**What to do**: Create the main recipes endpoint for listing (GET) and creating (POST) recipes.

**Where to find context**:

- `docs/ROADMAP.md` (lines 398-409) — GET and POST endpoint specs
- `src/app/api/auth/username/route.ts` — Existing API route pattern
- `src/lib/auth-utils.ts` — Auth helpers

**Specific requirements**:

**GET `/api/recipes`** — List recipes with pagination, filtering, sorting:

- Parse query params using `recipeFilterSchema`
- For authenticated users: return their own recipes + public recipes
- For unauthenticated: return only public recipes (summary fields only)
- Apply filters: `search` (case-insensitive `contains` on `name` and `description`), `cuisine`, `difficulty`, `maxPrepTime`, `maxCookTime`, `dietary` (filter by dietary tag IDs), `minRating`
- Apply sorting: `newest` (createdAt desc), `oldest` (createdAt asc), `rating` (avgRating desc nulls last), `prepTime` (prepTime asc), `title` (name asc)
- Include pagination metadata in response
- Select only necessary fields for list view (use Prisma `select`)
- Include: author (id, name, username, image), primary image (first image where isPrimary=true, or first image by order), dietary tags (id, name)
- For authenticated users: include current user's tags and save status

**POST `/api/recipes`** — Create a new recipe:

- Require authentication via `requireAuth()`
- Validate body against `createRecipeSchema`
- Create recipe with all related records in a **Prisma transaction**:
  - Create Recipe record
  - For each ingredient: upsert into global `Ingredient` table (find or create by name), then create `RecipeIngredient` join record
  - Create `RecipeStep` records
  - Create `RecipeImage` records
  - Create `RecipeDietaryTag` join records (validate tag IDs exist)
- Return the created recipe with all relations (full `RecipeDetail` shape)
- Return 400 for validation errors with field-level details
- Return 401 for unauthenticated

**Patterns to follow**:

- Use `NextResponse.json()` for all responses
- Use try/catch with appropriate error status codes
- Use Prisma transactions for multi-table writes (`prisma.$transaction()`)
- Follow the auth check pattern from `src/app/api/auth/username/route.ts`

---

### Section 5: Recipe Detail, Update & Delete API Route (`src/app/api/recipes/[id]/route.ts`)

**What to do**: Create the single-recipe endpoint for reading, updating, and deleting.

**Where to find context**:

- `docs/ROADMAP.md` (lines 410-423) — GET, PUT, DELETE specs
- `src/lib/auth-utils.ts` — `canViewRecipe()`, `requireRecipeOwner()`

**Specific requirements**:

**GET `/api/recipes/:id`** — Get full recipe details:

- Accept optional `?token=` query param for share link access
- Use `canViewRecipe(recipeId, shareToken)` for access control
- Return full `RecipeDetail` shape with all relations:
  - Author (id, name, username, image)
  - All images (id, url, source, isPrimary, order) ordered by `order`
  - Ingredients (id, ingredient name, quantity, notes, order) ordered by `order`
  - Steps (id, stepNumber, instruction, duration) ordered by `stepNumber`
  - Dietary tags (id, name)
- For authenticated users: include current user's tags and save status for this recipe
- Return 404 if recipe not found or access denied

**PUT `/api/recipes/:id`** — Update a recipe:

- Use `requireRecipeOwner()` for auth + ownership check
- Validate body against `updateRecipeSchema`
- Handle partial updates — only update provided fields
- For ingredients: if `ingredients` array is provided, delete all existing `RecipeIngredient` records and create new ones (full replacement in a transaction)
- For steps: same full replacement pattern
- For images: same full replacement pattern
- For dietaryTagIds: same full replacement pattern
- Return updated recipe with all relations
- Return 400, 401, 403, or 404 as appropriate

**DELETE `/api/recipes/:id`** — Delete a recipe:

- Use `requireRecipeOwner()` for auth + ownership check
- Delete the recipe (cascade deletes handle related records per schema config)
- Return `{ success: true }` with 200 status
- Return 401, 403, or 404 as appropriate

**Patterns to follow**:

- Extract `id` from route params: `{ params }: { params: Promise<{ id: string }> }` (Next.js 15+ async params)
- Use Prisma transactions for update operations that touch multiple tables
- Return the `NextResponse` directly from auth helper failures

---

### Section 6: Recipe Duplicate API Route (`src/app/api/recipes/[id]/duplicate/route.ts`)

**What to do**: Create endpoint to duplicate an existing recipe.

**Where to find context**:

- `docs/ROADMAP.md` (lines 424-432) — Duplicate spec

**Specific requirements**:

**POST `/api/recipes/:id/duplicate`**:

- Require authentication via `requireAuth()`
- Use `canViewRecipe()` to verify the user can see the source recipe
- Fetch the source recipe with all relations (ingredients, steps, images, dietary tags)
- Create a new recipe in a transaction:
  - Copy all fields, append " (Copy)" to the name
  - Set `authorId` to the current user
  - Set `visibility` to PRIVATE
  - Copy ingredients (create new `RecipeIngredient` records pointing to same `Ingredient` records)
  - Copy steps (create new `RecipeStep` records)
  - Copy images (create new `RecipeImage` records with same URLs — reference copy, not file duplication)
  - Copy dietary tag associations
  - Reset `avgRating` to null, `ratingCount` to 0
- Return the new recipe with all relations (full `RecipeDetail` shape)
- Return 401, 404 as appropriate

---

### Section 7: Image Management API Routes

**What to do**: Create endpoints for deleting recipe images and generating Cloudinary upload signatures.

**Where to find context**:

- `docs/ROADMAP.md` (lines 433-498) — Image API specs

**Specific requirements**:

**DELETE `/api/images/[id]`** (`src/app/api/images/[id]/route.ts`):

- Require authentication
- Look up the image, then verify the current user owns the recipe the image belongs to
- Delete the `RecipeImage` record from the database
- Note: Cloudinary cleanup (deleting from Cloudinary CDN) is a nice-to-have; for now, just remove the database record
- Return `{ success: true }`
- Return 401, 403, 404 as appropriate

**POST `/api/images/upload-signature`** (`src/app/api/images/upload-signature/route.ts`):

- Require authentication
- Call `generateUploadSignature()` from `src/lib/cloudinary.ts`
- Return the signature data for the client-side upload widget
- Return 401 if unauthenticated

---

### Section 8: Update Test Factories (`src/test/factories.ts`)

**What to do**: Add mock factories that produce data matching the new recipe types.

**Where to find context**:

- `src/test/factories.ts` — Existing factory pattern
- `src/types/recipe.ts` — New types to match

**Specific requirements**:

1. Keep existing `createMockUser()`, `createMockSession()`, `createMockRecipe()` unchanged
2. Add `createMockRecipeListItem(overrides?)` — returns `RecipeListItem` shape
3. Add `createMockRecipeDetail(overrides?)` — returns `RecipeDetail` shape
4. Add `createMockRecipeIngredient(overrides?)` — returns a single ingredient object
5. Add `createMockRecipeStep(overrides?)` — returns a single step object
6. Add `createMockPaginatedResponse<T>(data, overrides?)` — wraps data with pagination

**Patterns to follow**:

- Follow existing override pattern
- Use realistic default values

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `src/types/recipe.ts` exports all types: `RecipeIngredientInput`, `RecipeStepInput`, `RecipeImageInput`, `RecipeFormData`, `RecipeListItem`, `RecipeDetail`, `RecipeFilters`, `PaginatedResponse`
- [ ] `src/lib/validations/recipe.ts` exports schemas: `createRecipeSchema`, `updateRecipeSchema`, `recipeFilterSchema` and inferred types
- [ ] `POST /api/recipes` creates a recipe with ingredients, steps, images, and dietary tags in a single transaction
- [ ] `GET /api/recipes` returns paginated recipes with filters and sorting
- [ ] `GET /api/recipes/:id` returns full recipe detail with visibility check
- [ ] `PUT /api/recipes/:id` updates a recipe with ownership check
- [ ] `DELETE /api/recipes/:id` deletes a recipe with ownership check and cascade
- [ ] `POST /api/recipes/:id/duplicate` creates a copy with correct author and PRIVATE visibility
- [ ] `DELETE /api/images/:id` removes an image with ownership verification
- [ ] `POST /api/images/upload-signature` returns valid Cloudinary signature for authenticated users
- [ ] All API routes return appropriate error codes (400, 401, 403, 404)
- [ ] Validation errors return field-level detail in 400 responses
- [ ] Unauthenticated GET requests to `/api/recipes` return only public recipes

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Enums imported from `@/generated/prisma/client`, not redefined
- [ ] Prisma transactions used for all multi-table writes

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

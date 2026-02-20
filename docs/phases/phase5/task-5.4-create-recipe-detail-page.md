---
task_id: 'task-5.4'
title: 'Create Recipe Detail Page'
phase: 5
task_number: 4
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-5.3'
blocks:
  - 'task-5.5'
  - 'task-5.6'
created_at: '2026-02-20'
---

# Create Recipe Detail Page

## Current State

> Recipe API routes (task-5.1) return full recipe detail data. Recipe card and grid components (task-5.3) exist for list views. shadcn/ui components are available. No recipe detail page exists yet.

- **What exists**:
  - `src/types/recipe.ts` — `RecipeDetail` type with full recipe shape
  - `src/app/api/recipes/[id]/route.ts` — GET endpoint returning full recipe detail
  - `src/app/api/recipes/[id]/duplicate/route.ts` — POST endpoint for duplication
  - `src/components/ui/` — All shadcn/ui components (tabs, badge, separator, dialog, button, card, avatar, alert-dialog, tooltip)
  - `src/lib/auth-utils.ts` — `getCurrentUser()` for server-side auth check
  - `lucide-react` icons
  - `src/components/layout/` — Main layout (header, footer)
  - Middleware protects `/recipes/*/edit` but allows `/recipes/[id]` for viewing
- **What is missing**:
  - `src/app/(main)/recipes/[id]/page.tsx` — Recipe detail page
  - `src/components/recipes/recipe-detail/` — Detail view sub-components
- **Relevant code**:
  - `src/types/recipe.ts` — `RecipeDetail` type
  - `src/app/api/recipes/[id]/route.ts` — API for recipe detail
  - `docs/ROADMAP.md` (lines 523-543) — Detail page spec
  - `src/app/(main)/dashboard/page.tsx` — Existing page pattern reference

---

## Desired Outcome

- **End state**: A fully functional recipe detail page at `/recipes/[id]` that displays all recipe information, with action buttons for edit, delete, duplicate, and print. The page respects visibility rules and supports share link tokens via query parameters.
- **User-facing changes**: Users can navigate to `/recipes/[id]` and see the complete recipe with all metadata, ingredients, steps, images, and dietary tags.
- **Developer-facing changes**:
  - `src/app/(main)/recipes/[id]/page.tsx` — Recipe detail page
  - `src/components/recipes/recipe-detail/recipe-hero.tsx` — Hero image section
  - `src/components/recipes/recipe-detail/recipe-metadata.tsx` — Metadata bar (times, servings, difficulty, cuisine)
  - `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — Ingredients list with checkboxes
  - `src/components/recipes/recipe-detail/recipe-steps.tsx` — Step-by-step instructions
  - `src/components/recipes/recipe-detail/recipe-images.tsx` — Image gallery
  - `src/components/recipes/recipe-detail/recipe-actions.tsx` — Action buttons (edit, delete, duplicate, print)
  - `src/components/recipes/recipe-detail/delete-recipe-dialog.tsx` — Delete confirmation dialog
  - `src/components/recipes/recipe-detail/nutrition-section.tsx` — Collapsible nutrition data display

---

## Scope & Boundaries

### In Scope

- Create the recipe detail page with all sub-components listed above
- Display all recipe data: hero image, metadata, ingredients, steps, dietary tags, nutrition, images
- Owner-only action buttons: Edit (link to `/recipes/[id]/edit`), Delete (with confirmation dialog), Duplicate
- Print button (basic `window.print()` trigger)
- Ingredient checkboxes for cooking mode (local state, not persisted)
- Support `?token=` query param for share link access
- Responsive layout (single column on mobile, side-by-side ingredients/steps on desktop)
- Collapsible nutrition section (if `nutritionData` exists)

### Out of Scope

- Star rating widget interaction — Phase 8
- Comments section — Phase 8
- Share dialog — Phase 8
- Tag toggle buttons (Favorite, To Try, Made Before) — Phase 6
- Save/unsave button — Phase 6
- Cooking mode (full-screen step-by-step) — Phase 10
- Cooking timer — Phase 10
- Print view CSS `@media print` styles — Phase 10
- Serving adjuster / recipe scaling — Phase 10
- AI ingredient substitution buttons — Phase 9
- AI nutrition estimation button — Phase 9
- Related recipes suggestion section — can be added later
- Guest summary-only view / login prompt — Phase 8

### Dependencies

- Task-5.1 (types, API routes)
- Task-5.3 (recipe card components — for potential "related recipes" section, but that's out of scope)

---

## Implementation Details

### Section 1: Recipe Detail Page (`src/app/(main)/recipes/[id]/page.tsx`)

**What to do**: Create the main page component that fetches recipe data and renders the detail view.

**Where to find context**:

- `docs/ROADMAP.md` (lines 525-543) — Page spec
- `src/app/(main)/dashboard/page.tsx` — Existing page pattern

**Specific requirements**:

- Server component that fetches recipe data
- Accept route params: `{ params: { id: string } }` and search params: `{ searchParams: { token?: string } }`
- Fetch recipe detail from `GET /api/recipes/[id]?token=...` (or call Prisma directly from the server component for performance)
- If using direct Prisma access: replicate the visibility check from `canViewRecipe()` or call the utility directly
- Handle 404: if recipe not found or access denied, render `notFound()` from Next.js
- Pass recipe data to sub-components
- Determine if the current user is the recipe owner (for showing edit/delete actions)
- Set page metadata: `generateMetadata()` with recipe title and description

---

### Section 2: Recipe Hero Image (`src/components/recipes/recipe-detail/recipe-hero.tsx`)

**What to do**: Display the primary recipe image as a hero banner at the top of the detail page.

**Specific requirements**:

- Props: `images: RecipeDetail['images']`, `recipeName: string`
- Display the primary image (where `isPrimary === true`) or the first image by order
- If no images exist, show a styled placeholder (large, with food icon and recipe name)
- Use `next/image` for optimization
- Full-width, max-height capped (e.g., 400px on desktop, 250px on mobile)
- Rounded bottom corners, subtle overlay gradient at the bottom for text readability

---

### Section 3: Recipe Metadata Bar (`src/components/recipes/recipe-detail/recipe-metadata.tsx`)

**What to do**: Display key recipe metadata in a horizontal bar below the hero.

**Specific requirements**:

- Props: `recipe: RecipeDetail`
- Display in a row (wraps on mobile):
  - Prep time (clock icon + "X min prep")
  - Cook time (clock icon + "X min cook")
  - Total time (calculated: prepTime + cookTime)
  - Servings (users icon + "X servings")
  - Difficulty (badge — color-coded: green/amber/red)
  - Cuisine type (badge)
- Use `lucide-react` icons
- Compact, clean design with separators between items

---

### Section 4: Recipe Ingredients List (`src/components/recipes/recipe-detail/recipe-ingredients.tsx`)

**What to do**: Display the ingredients list with interactive checkboxes.

**Specific requirements**:

- Props: `ingredients: RecipeDetail['ingredients']`
- Render ingredients ordered by `order` field
- Each ingredient: checkbox + name + quantity + notes (if present)
- Checkbox toggles local state (strikethrough on checked — cooking aid)
- State is local (useState), not persisted
- Clean list layout with proper spacing

---

### Section 5: Recipe Steps (`src/components/recipes/recipe-detail/recipe-steps.tsx`)

**What to do**: Display step-by-step instructions.

**Specific requirements**:

- Props: `steps: RecipeDetail['steps']`
- Render steps ordered by `stepNumber`
- Each step: large step number, instruction text, optional duration badge (e.g., "~15 min")
- Clear visual separation between steps
- Readable typography (larger text for instructions)

---

### Section 6: Recipe Image Gallery (`src/components/recipes/recipe-detail/recipe-images.tsx`)

**What to do**: Display all recipe images in a thumbnail strip.

**Specific requirements**:

- Props: `images: RecipeDetail['images']`
- Only render if there are 2+ images (single image is already shown in hero)
- Display as a horizontal scrollable thumbnail strip
- Click on thumbnail opens a larger view (use shadcn/ui `Dialog` for a simple lightbox)
- Use `next/image` for all thumbnails

---

### Section 7: Recipe Actions (`src/components/recipes/recipe-detail/recipe-actions.tsx`)

**What to do**: Create the action buttons bar for recipe operations.

**Specific requirements**:

- Props: `recipeId: string`, `isOwner: boolean`, `recipeName: string`
- Buttons:
  - **Edit** (owner only): Link to `/recipes/[id]/edit` — pencil icon
  - **Delete** (owner only): Opens `DeleteRecipeDialog` — trash icon
  - **Duplicate**: Calls `POST /api/recipes/[id]/duplicate` — copy icon. On success, navigate to the new recipe's detail page with a success toast
  - **Print**: Calls `window.print()` — printer icon
- Layout: horizontal button row, right-aligned or spread
- Use shadcn/ui `Button` with icon variants
- Duplicate button shows loading state while API call is in progress

---

### Section 8: Delete Recipe Dialog (`src/components/recipes/recipe-detail/delete-recipe-dialog.tsx`)

**What to do**: Create a confirmation dialog for recipe deletion.

**Specific requirements**:

- Props: `recipeId: string`, `recipeName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- Use shadcn/ui `AlertDialog`
- Display: "Are you sure you want to delete '{recipeName}'? This action cannot be undone."
- "Cancel" button closes the dialog
- "Delete" button calls `DELETE /api/recipes/[id]`
- On success: redirect to `/my-recipes` (or `/dashboard`) with a success toast
- On error: show error toast, keep dialog open
- Show loading state on "Delete" button during API call

---

### Section 9: Nutrition Section (`src/components/recipes/recipe-detail/nutrition-section.tsx`)

**What to do**: Display cached nutrition data if available.

**Specific requirements**:

- Props: `nutritionData: Record<string, unknown> | null`
- If `nutritionData` is null: show nothing (the "Estimate Nutrition" button will be added in Phase 9)
- If `nutritionData` exists: render a collapsible card showing nutrition values per serving
  - Display known fields: calories, protein, carbs, fat, fiber, sugar, sodium
  - Use a clean table or grid layout
  - Add a disclaimer: "AI-generated estimates. For accurate values, consult a nutritionist."

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] Recipe detail page loads at `/recipes/[id]` and displays full recipe data
- [ ] Hero image displays primary image or fallback placeholder
- [ ] Metadata bar shows prep time, cook time, total time, servings, difficulty, cuisine
- [ ] Ingredients list renders all ingredients with checkboxes
- [ ] Ingredient checkboxes toggle strikethrough on click
- [ ] Steps display in order with step numbers, instructions, and optional durations
- [ ] Image gallery shows when 2+ images exist with thumbnail strip
- [ ] Edit and Delete buttons appear only for recipe owner
- [ ] Duplicate button works for any user with view access
- [ ] Print button triggers `window.print()`
- [ ] Delete dialog shows confirmation and handles success/error
- [ ] Page returns 404 for non-existent or access-denied recipes
- [ ] Page handles `?token=` query param for share link access
- [ ] Page sets metadata (title, description) from recipe data
- [ ] Nutrition section displays when data exists, hidden when null
- [ ] Page is responsive (single column on mobile, wider layout on desktop)
- [ ] All components render correctly in both light and dark mode

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Sub-components organized in `src/components/recipes/recipe-detail/`

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented (no rating widget, no comments, no sharing, no tags, no cooking mode)
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_

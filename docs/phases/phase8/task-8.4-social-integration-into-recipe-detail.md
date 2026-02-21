---
task_id: 'task-8.4'
title: 'Social Integration into Recipe Detail'
phase: 8
task_number: 4
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-8.1'
  - 'task-8.2'
  - 'task-8.3'
blocks: []
created_at: '2026-02-21'
---

# Social Integration into Recipe Detail

## Current State

> Tasks 8.1, 8.2, and 8.3 have created all the individual social components and API routes: sharing dialog, star rating, comment section, guest access handling, and login prompt. However, these components are not yet wired into the recipe detail page. The recipe detail page currently shows recipe info, ingredients, steps, images, actions (edit/delete/duplicate), tag toggles, and save button — but no rating widget, comment section, share button, or guest handling.

- **What exists**:
  - Recipe detail page (`src/app/(main)/recipes/[id]/page.tsx`) with hero, metadata, ingredients, steps, images, actions, tag toggles, save button
  - Recipe detail components: `recipe-hero.tsx`, `recipe-metadata.tsx`, `recipe-images.tsx`, `recipe-ingredients.tsx`, `recipe-steps.tsx`, `recipe-actions.tsx`, `nutrition-section.tsx`, `delete-recipe-dialog.tsx` (`src/components/recipes/recipe-detail/`)
  - Share dialog component (task-8.1: `src/components/social/share-dialog.tsx`)
  - Star rating component (task-8.2: `src/components/social/star-rating.tsx`)
  - Comment section component (task-8.2: `src/components/social/comment-section.tsx`)
  - Login prompt component (task-8.3: `src/components/shared/login-prompt.tsx`)
  - Tag toggles and save button (`src/components/recipes/tag-toggles.tsx`, `save-button.tsx`)
  - All supporting hooks: `use-sharing.ts`, `use-ratings.ts`, `use-comments.ts`, `use-tags.ts`
- **What is missing**:
  - Integration of share dialog into recipe actions
  - Integration of star rating widget into recipe detail page
  - Integration of comment section into recipe detail page
  - Conditional rendering based on auth state and recipe ownership
  - Guest view handling (summary with login prompt overlay)
  - End-to-end verification of the complete social experience
- **Relevant code**:
  - `src/app/(main)/recipes/[id]/page.tsx` — Current recipe detail page
  - `src/components/recipes/recipe-detail/recipe-actions.tsx` — Action buttons
  - `src/components/social/` — All social components from tasks 8.1 and 8.2
  - `src/components/shared/login-prompt.tsx` — Guest login prompt from task-8.3
  - `docs/ROADMAP.md` (lines 755-763) — Social integration spec

---

## Desired Outcome

- **End state**: The recipe detail page is the complete social hub for a recipe. It displays the star rating widget, comment section, share button (with share dialog), tag toggles, and save button — all with proper conditional rendering based on the user's relationship to the recipe (owner vs viewer vs guest).
- **User-facing changes**: Recipe detail page now shows ratings, comments, and share button. Owner sees full management controls. Authenticated viewers see rating/commenting/saving capabilities. Guests see a summary with a login prompt.
- **Developer-facing changes**:
  - Updated `src/app/(main)/recipes/[id]/page.tsx` — Wired all social components
  - Updated `src/components/recipes/recipe-detail/recipe-actions.tsx` — Added share button
  - Tests for the integrated recipe detail page

---

## Scope & Boundaries

### In Scope

- Wire share dialog into recipe detail page actions
- Wire star rating component into recipe detail page (below metadata, above ingredients)
- Wire comment section into recipe detail page (at the bottom)
- Add conditional rendering based on user relationship: owner, authenticated viewer, guest
- Handle guest access with login prompt overlay on recipe detail
- Verify end-to-end flow: view → rate → comment → share → tag → save
- Write integration tests for the recipe detail page with all social features

### Out of Scope

- Modifying the individual social components themselves (those are finalized in 8.1, 8.2, 8.3)
- AI features on recipe detail (Phase 9)
- Recipe scaling and cooking mode (Phase 10)
- Performance optimization (Phase 12)
- Community page modifications

### Dependencies

- Sharing system complete (task-8.1)
- Ratings and comments complete (task-8.2)
- Guest access and community pages complete (task-8.3)
- Recipe detail page exists (task-5.4 — done)
- Tag toggles and save button exist (task-6.1 — done)

---

## Implementation Details

### Section 1: Update Recipe Detail Page (`src/app/(main)/recipes/[id]/page.tsx`)

**What to do**: Wire all social components into the recipe detail page with proper conditional rendering.

**Where to find context**:

- `src/app/(main)/recipes/[id]/page.tsx` — Current implementation
- `docs/ROADMAP.md` (lines 525-543) — Recipe detail page full spec
- `docs/ROADMAP.md` (lines 755-763) — Social integration spec

**Specific requirements**:

1. **Data fetching**: The page should fetch:
   - Recipe detail (existing)
   - Rating info (from `use-ratings.ts` hook)
   - Comments (from `use-comments.ts` hook, first page)
   - User's tag/save status (existing)
   - Shared users (from `use-sharing.ts` hook, if owner)

2. **Layout order** (top to bottom):
   - Recipe hero image
   - Recipe title, author info
   - **Star rating widget** (new — below title, above metadata)
   - Recipe metadata bar (prep time, cook time, servings, difficulty, cuisine)
   - Dietary tags
   - **Action buttons row**: Edit, Delete, Duplicate (owner only), **Share** (owner only, new), Print
   - **Tag toggles + Save button** (existing — for authenticated non-owners)
   - Ingredients list (with checkbox toggles)
   - Step-by-step instructions
   - Nutrition section (existing placeholder)
   - Image gallery
   - **Comment section** (new — at the bottom)

3. **Conditional rendering rules**:
   - **Owner**: Sees all, including edit/delete/share buttons. Cannot rate own recipe (star rating is read-only). Can delete any comment.
   - **Authenticated viewer** (has view access): Sees full recipe, can rate, comment, tag, save. No edit/delete/share buttons.
   - **Guest**: Sees summary only (title, image, metadata). Ingredients, steps, comments, nutrition are blurred/hidden behind login prompt overlay. No interactive features.

4. **Props to pass to social components**:
   - `StarRating`: `recipeId`, `avgRating`, `ratingCount`, `userRating`, `isOwner`, `isAuthenticated`
   - `CommentSection`: `recipeId`, `recipeAuthorId`, `isAuthenticated`
   - `ShareDialog`: `recipeId`, `currentVisibility`, `isOwner`

**Patterns to follow**:

- Server component for data fetching, client components for interactive sections
- Use existing recipe detail sub-components (`recipe-hero`, `recipe-metadata`, etc.)

---

### Section 2: Update Recipe Actions (`src/components/recipes/recipe-detail/recipe-actions.tsx`)

**What to do**: Add a "Share" button to the recipe actions that opens the share dialog.

**Where to find context**:

- `src/components/recipes/recipe-detail/recipe-actions.tsx` — Current implementation

**Specific requirements**:

1. Add a "Share" button (visible only to recipe owner)
2. Button triggers the `ShareDialog` component
3. Use a share icon (e.g., `Share2` from lucide-react)
4. Position alongside existing Edit, Delete, Duplicate buttons

**Patterns to follow**:

- Follow existing button pattern in recipe-actions.tsx

---

### Section 3: Tests

**What to do**: Write integration tests for the recipe detail page with all social features wired in.

**Where to find context**:

- `src/app/(main)/recipes/[id]/page.tsx` — Page to test
- Existing test patterns in `src/app/(main)/` tests

**Specific requirements**:

**Integration Tests** (`src/app/(main)/recipes/[id]/__tests__/page.test.tsx`):

1. **Owner view**:
   - Renders all recipe detail sections
   - Shows edit, delete, duplicate, share buttons
   - Star rating is in read-only mode (cannot rate own)
   - Comment section visible with delete-any capability
   - Tag toggles NOT shown (owner doesn't tag their own recipes — or shown if design allows)

2. **Authenticated viewer view**:
   - Renders full recipe detail
   - No edit/delete/share buttons
   - Star rating is interactive (can rate)
   - Comment section visible with add form
   - Tag toggles and save button visible

3. **Guest view**:
   - Renders summary (title, image, metadata)
   - Ingredients, steps, comments are hidden/blurred
   - Login prompt overlay shown
   - No interactive features (no rating, commenting, tagging)

4. **Access denied view**:
   - Private recipe by another user shows 404
   - Shared recipe without access shows 404

**Patterns to follow**:

- Use `vi.mock()` for mocking auth, API calls, and hooks
- Test conditional rendering by varying auth state and ownership

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] Recipe detail page shows star rating widget with average and user rating
- [ ] Recipe detail page shows comment section with form and list
- [ ] Share button opens share dialog for recipe owner
- [ ] Owner sees all management controls but cannot rate own recipe
- [ ] Authenticated viewer can rate, comment, tag, and save
- [ ] Guest sees summary only with login prompt overlay
- [ ] Tag toggles and save button work correctly on recipe detail
- [ ] End-to-end flow works: navigate to recipe → rate → comment → share → tag
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Conditional rendering is clean and covers all user states

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

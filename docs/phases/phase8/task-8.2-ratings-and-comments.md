---
task_id: 'task-8.2'
title: 'Ratings & Comments'
phase: 8
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
  - 'task-5.4'
blocks:
  - 'task-8.4'
created_at: '2026-02-21'
---

# Ratings & Comments

## Current State

> The Prisma schema already defines `Rating` and `Comment` models with all necessary fields, constraints, and indexes. The `Recipe` model has denormalized `avgRating` (Float?) and `ratingCount` (Int, default 0) fields. However, no API routes, UI components, or React Query hooks exist for ratings or comments.

- **What exists**:
  - `Rating` model with `@@unique([userId, recipeId])`, `value` (Int, 1-5), timestamps (`prisma/schema.prisma`)
  - `Comment` model with `@@index([recipeId])`, `content` (String), timestamps (`prisma/schema.prisma`)
  - `Recipe.avgRating` (Float?) and `Recipe.ratingCount` (Int, default 0) denormalized fields (`prisma/schema.prisma`)
  - `User` model relations: `ratings Rating[]` and `comments Comment[]` (`prisma/schema.prisma`)
  - `canViewRecipe()` auth utility for access checks (`src/lib/auth-utils.ts`)
  - `requireAuth()` and `requireRecipeOwner()` auth helpers (`src/lib/auth-utils.ts`)
  - `nutrition-section.tsx` component on recipe detail page shows a placeholder for nutrition data (`src/components/recipes/recipe-detail/nutrition-section.tsx`)
  - Recipe detail page exists but has no ratings or comments sections (`src/app/(main)/recipes/[id]/page.tsx`)
  - Prisma client singleton (`src/lib/db.ts`)
- **What is missing**:
  - `src/app/api/recipes/[id]/ratings/route.ts` — GET (rating info), POST (upsert rating)
  - `src/app/api/recipes/[id]/comments/route.ts` — GET (list comments), POST (add comment)
  - `src/app/api/comments/[id]/route.ts` — PUT (edit own comment), DELETE (own or recipe author)
  - `src/components/social/star-rating.tsx` — Interactive star rating widget
  - `src/components/social/comment-section.tsx` — Comment list with form
  - `src/hooks/use-ratings.ts` — Rating React Query hooks
  - `src/hooks/use-comments.ts` — Comment React Query hooks
  - `src/lib/validations/social.ts` — Rating and comment Zod schemas
  - Tests for all of the above
- **Relevant code**:
  - `prisma/schema.prisma` — Rating, Comment models
  - `src/lib/auth-utils.ts` — canViewRecipe, requireAuth
  - `src/app/api/recipes/[id]/route.ts` — Pattern for recipe API routes
  - `src/hooks/use-tags.ts` — Pattern for mutation hooks with optimistic updates
  - `docs/CTO_SPECS.md` (lines 569-576) — Social API contract
  - `docs/CTO_SPECS.md` (lines 256-265) — Rating & comment rules
  - `docs/SENIOR_DEVELOPER.md` (lines 293-320) — Ratings & comments implementation

---

## Desired Outcome

- **End state**: Users can rate recipes 1-5 stars (upsert pattern) and leave comments on public/shared recipes. Recipe detail page displays a star rating widget with the average and the user's own rating, plus a paginated comment section with add/edit/delete capabilities. The `avgRating` and `ratingCount` on the Recipe model are recalculated on each rating change.
- **User-facing changes**: Recipe detail page shows interactive star rating and a comment section. Users can rate (one rating per recipe, updatable) and comment. Comment authors can edit/delete their own comments. Recipe authors can delete any comment on their recipes.
- **Developer-facing changes**:
  - `src/app/api/recipes/[id]/ratings/route.ts` — Rating endpoints
  - `src/app/api/recipes/[id]/comments/route.ts` — Comment list and add endpoints
  - `src/app/api/comments/[id]/route.ts` — Comment edit/delete endpoints
  - `src/components/social/star-rating.tsx` — Star rating component
  - `src/components/social/comment-section.tsx` — Comment section component
  - `src/hooks/use-ratings.ts` — Rating hooks
  - `src/hooks/use-comments.ts` — Comment hooks
  - `src/lib/validations/social.ts` — Social validation schemas
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create rating API routes (GET info, POST upsert)
- Create comment API routes (GET list, POST add, PUT edit, DELETE remove)
- Create star rating UI component with interactive and read-only modes
- Create comment section UI component with form, list, edit/delete
- Create React Query hooks for ratings and comments
- Create Zod validation schemas for rating and comment inputs
- Recalculate `avgRating` and `ratingCount` on each rating upsert
- Enforce access rules: cannot rate own recipes, must have view access to rate/comment
- Sanitize comment content to prevent XSS
- Paginate comments (newest first)
- Write tests for all API routes, components, and hooks

### Out of Scope

- Integrating rating/comment components into the recipe detail page — task-8.4
- Community page — task-8.3
- Guest access restrictions — task-8.3
- Nested replies / threaded comments — explicitly not supported per `docs/CTO_SPECS.md` (line 264)
- Comment moderation beyond owner delete — no flagging/reporting system
- Notification when recipe is rated/commented — deferred per `docs/CTO_SPECS.md` (lines 216-234)

### Dependencies

- Recipe CRUD API routes functional (task-5.1 — done)
- Recipe detail page exists (task-5.4 — done)
- `canViewRecipe()` auth utility implemented (done: `src/lib/auth-utils.ts`)
- `Rating` and `Comment` Prisma models defined and migrated (done)

---

## Implementation Details

### Section 1: Social Validation Schemas (`src/lib/validations/social.ts`)

**What to do**: Create Zod schemas for rating and comment validation.

**Where to find context**:

- `src/lib/validations/recipe.ts` — Existing validation schema pattern
- `docs/CTO_SPECS.md` (lines 569-576) — Social API contract

**Specific requirements**:

1. **`ratingSchema`**: Validates `{ value: number }` — integer, min 1, max 5
2. **`commentCreateSchema`**: Validates `{ content: string }` — min 1 char, max 1000 chars, trimmed
3. **`commentUpdateSchema`**: Validates `{ content: string }` — same constraints as create
4. **`commentListSchema`**: Validates query params `page` (positive int, default 1), `limit` (int, min 1, max 50, default 20)
5. Export inferred types for all schemas

**Patterns to follow**:

- Follow `src/lib/validations/recipe.ts` — Zod schemas with custom error messages

---

### Section 2: Rating API Route (`src/app/api/recipes/[id]/ratings/route.ts`)

**What to do**: Create GET and POST endpoints for recipe ratings.

**Where to find context**:

- `docs/CTO_SPECS.md` (line 573) — Rating API contract
- `docs/CTO_SPECS.md` (lines 256-262) — Rating rules
- `docs/SENIOR_DEVELOPER.md` (lines 301-307) — Rating logic

**Specific requirements**:

1. **GET** `/api/recipes/:id/ratings`:
   - No authentication required (public info on public recipes)
   - Check recipe access via `canViewRecipe()`
   - Return: `{ avgRating: number | null, ratingCount: number, userRating: number | null }`
   - `userRating` is the current user's rating (null if not authenticated or not rated)

2. **POST** `/api/recipes/:id/ratings`:
   - Require authentication
   - Check recipe access via `canViewRecipe()`
   - Validate body against `ratingSchema`
   - **Cannot rate own recipes** — return 403 if `recipe.authorId === session.user.id`
   - **Upsert pattern**: Create new rating OR update existing (per `@@unique([userId, recipeId])`)
   - **Recalculate denormalized fields** after upsert:
     ```
     const stats = await prisma.rating.aggregate({
       where: { recipeId },
       _avg: { value: true },
       _count: { value: true },
     });
     await prisma.recipe.update({
       where: { id: recipeId },
       data: {
         avgRating: stats._avg.value,
         ratingCount: stats._count.value,
       },
     });
     ```
   - Return the user's rating and updated avgRating/ratingCount

**Patterns to follow**:

- Follow `src/app/api/recipes/[id]/tags/route.ts` — auth + access check pattern
- Use Prisma `upsert` for the rating record

---

### Section 3: Comment API Routes

**What to do**: Create endpoints for comment CRUD.

**Where to find context**:

- `docs/CTO_SPECS.md` (lines 574-576) — Comment API contract
- `docs/CTO_SPECS.md` (lines 263-265) — Comment rules

#### Section 3a: `src/app/api/recipes/[id]/comments/route.ts`

**Specific requirements**:

1. **GET** `/api/recipes/:id/comments`:
   - Require authentication
   - Check recipe access via `canViewRecipe()`
   - Validate query params against `commentListSchema`
   - Return paginated comments, newest first (`orderBy: { createdAt: 'desc' }`)
   - Include author info per comment: `id`, `username`, `name`, `image` — NO email
   - Return `PaginatedResponse` with `{ data: comments[], pagination: { total, page, pageSize, totalPages } }`

2. **POST** `/api/recipes/:id/comments`:
   - Require authentication
   - Check recipe access via `canViewRecipe()`
   - Validate body against `commentCreateSchema`
   - **Sanitize content**: Strip HTML tags to prevent XSS (use a simple regex or a library — at minimum, escape `<`, `>`, `&`, `"`, `'`)
   - Create `Comment` record
   - Return the created comment with author info

#### Section 3b: `src/app/api/comments/[id]/route.ts`

**Specific requirements**:

1. **PUT** `/api/comments/:id`:
   - Require authentication
   - Find comment by ID — return 404 if not found
   - **Only the comment author** can edit — return 403 if `comment.userId !== session.user.id`
   - Validate body against `commentUpdateSchema`
   - Sanitize content (same as create)
   - Update comment content and `updatedAt`
   - Return updated comment

2. **DELETE** `/api/comments/:id`:
   - Require authentication
   - Find comment by ID with recipe relation — return 404 if not found
   - **Comment author OR recipe author** can delete — return 403 otherwise
   - Delete the comment record
   - Return success confirmation

**Patterns to follow**:

- Follow existing API route patterns for auth, validation, and error handling
- Use `NextResponse.json()` for all responses

---

### Section 4: Star Rating Component (`src/components/social/star-rating.tsx`)

**What to do**: Create an interactive star rating widget.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 309-313) — Rating UI spec
- `docs/ROADMAP.md` (lines 729-730) — Star rating component spec

**Specific requirements**:

1. **Props interface**: `{ recipeId: string; avgRating: number | null; ratingCount: number; userRating: number | null; isOwner: boolean; isAuthenticated: boolean }`
2. **Interactive mode** (authenticated, non-owner):
   - 5 clickable stars
   - Hover preview (highlighted stars follow cursor)
   - Click to rate (calls mutation)
   - Show current user's rating highlighted
   - Optimistic update on click
3. **Read-only mode** (guest, or owner):
   - Display average rating with filled stars (support half-stars or round to nearest)
   - Show rating count text (e.g., "4.2 (15 ratings)")
   - Owner sees "You cannot rate your own recipe" tooltip
4. **Visual design**: Use shadcn/ui colors, filled vs outline star icons

**Patterns to follow**:

- `'use client'` component
- Follow `src/components/recipes/tag-toggles.tsx` — for toggle/interactive pattern

---

### Section 5: Comment Section Component (`src/components/social/comment-section.tsx`)

**What to do**: Create the comment section with form and paginated list.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 314-320) — Comment UI spec
- `docs/ROADMAP.md` (lines 731-732) — Comment section spec

**Specific requirements**:

1. **Props interface**: `{ recipeId: string; recipeAuthorId: string; isAuthenticated: boolean }`
2. **Comment form**:
   - Textarea with character count (max 1000)
   - Submit button (disabled when empty or exceeds max)
   - Loading state during submission
   - Clear form on successful submit
   - Show login prompt if not authenticated
3. **Comment list**:
   - Each comment card: user avatar, username, relative timestamp (e.g., "2 hours ago"), content
   - Edit button (shown for comment author only) — inline edit mode with save/cancel
   - Delete button (shown for comment author OR recipe author) — with confirmation dialog
   - Empty state: "No comments yet. Be the first to comment!"
4. **Pagination**: "Load more" button at the bottom (not infinite scroll)

**Patterns to follow**:

- `'use client'` component
- Use shadcn/ui components: Avatar, Button, Textarea, AlertDialog (for delete confirmation)
- Use toast notifications for success/error feedback

---

### Section 6: Rating React Query Hooks (`src/hooks/use-ratings.ts`)

**What to do**: Create React Query hooks for rating operations.

**Where to find context**:

- `src/hooks/use-tags.ts` — Pattern for mutation hooks

**Specific requirements**:

1. **`useRecipeRating(recipeId)`** — Query hook to fetch rating info (avgRating, ratingCount, userRating)
   - Query key: `['recipe-rating', recipeId]`
   - `staleTime`: 30 seconds
2. **`useRateRecipe()`** — Mutation to upsert a rating
   - Optimistic update: immediately update userRating and recalculate avgRating/ratingCount locally
   - On error: revert to previous state
   - On settle: invalidate `['recipe-rating', recipeId]` and `['recipe', recipeId]`
   - Toast on error

**Patterns to follow**:

- Follow `src/hooks/use-tags.ts` — co-located fetchers, optimistic updates, named exports

---

### Section 7: Comment React Query Hooks (`src/hooks/use-comments.ts`)

**What to do**: Create React Query hooks for comment CRUD.

**Where to find context**:

- `src/hooks/use-tags.ts` — Pattern for mutation hooks
- `src/hooks/use-recipes.ts` — Pattern for paginated query hooks

**Specific requirements**:

1. **`useComments(recipeId, page)`** — Query hook for paginated comments
   - Query key: `['recipe-comments', recipeId, page]`
   - `staleTime`: 30 seconds
   - `keepPreviousData` for smooth pagination
2. **`useAddComment()`** — Mutation to add a comment
   - On success: invalidate `['recipe-comments', recipeId]`, toast success
3. **`useEditComment()`** — Mutation to edit a comment
   - Optimistic update: immediately update comment content in cache
   - On error: revert
4. **`useDeleteComment()`** — Mutation to delete a comment
   - Optimistic update: immediately remove comment from cache
   - On error: revert
   - On settle: invalidate `['recipe-comments', recipeId]`

**Patterns to follow**:

- Follow `src/hooks/use-tags.ts` — co-located fetchers, optimistic updates, named exports

---

### Section 8: Tests

**What to do**: Write tests for all new API routes, components, and hooks.

**Where to find context**:

- `src/app/api/recipes/[id]/tags/__tests__/route.test.ts` — API route test pattern
- `src/components/recipes/__tests__/tag-toggles.test.tsx` — Component test pattern

**Specific requirements**:

**Rating API Tests** (`src/app/api/recipes/[id]/ratings/__tests__/route.test.ts`):

- GET returns avgRating, ratingCount, and userRating for authenticated user
- GET returns null userRating for unauthenticated user
- POST creates new rating (value 1-5)
- POST updates existing rating (upsert)
- POST with invalid value (0, 6, non-integer) → 400
- POST cannot rate own recipe → 403
- POST requires auth → 401
- POST requires view access (private recipe of another user) → 404
- POST recalculates avgRating and ratingCount correctly

**Comment API Tests** (`src/app/api/recipes/[id]/comments/__tests__/route.test.ts`):

- GET returns paginated comments newest first
- GET returns author info without email
- POST creates comment with sanitized content
- POST with empty content → 400
- POST with content > 1000 chars → 400
- POST requires auth → 401
- POST requires view access → 404

**Comment CRUD Tests** (`src/app/api/comments/[id]/__tests__/route.test.ts`):

- PUT updates own comment
- PUT cannot edit another user's comment → 403
- DELETE own comment → success
- DELETE as recipe author → success (even if not comment author)
- DELETE another user's comment (non-recipe-author) → 403
- DELETE non-existent comment → 404

**Star Rating Component Tests** (`src/components/social/__tests__/star-rating.test.tsx`):

- Renders average rating and count in read-only mode
- Renders clickable stars in interactive mode
- Shows hover preview on mouse over
- Disables interaction for recipe owner
- Shows login prompt for unauthenticated users

**Comment Section Component Tests** (`src/components/social/__tests__/comment-section.test.tsx`):

- Renders comment form and list
- Submit button disabled when content is empty
- Character count updates correctly
- Edit and delete buttons shown for appropriate users
- Empty state shown when no comments

**Patterns to follow**:

- Use `vi.mock()` and `vi.hoisted()` for mocking Prisma and auth
- Co-located `__tests__/` directory pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] GET `/api/recipes/:id/ratings` returns avgRating, ratingCount, and userRating
- [ ] POST `/api/recipes/:id/ratings` creates/updates a rating (upsert)
- [ ] Cannot rate own recipe (403)
- [ ] avgRating and ratingCount recalculated on each rating
- [ ] GET `/api/recipes/:id/comments` returns paginated comments newest first
- [ ] POST `/api/recipes/:id/comments` creates a sanitized comment
- [ ] PUT `/api/comments/:id` edits own comment only
- [ ] DELETE `/api/comments/:id` works for comment author and recipe author
- [ ] Star rating component shows hover preview and handles click
- [ ] Comment section shows form, list, edit/delete buttons appropriately
- [ ] XSS content is sanitized in comments
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Comment content is sanitized to prevent XSS
- [ ] No email leakage in comment author info

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

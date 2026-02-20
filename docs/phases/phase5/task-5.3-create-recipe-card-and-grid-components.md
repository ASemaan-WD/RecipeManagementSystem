---
task_id: 'task-5.3'
title: 'Create Recipe Card & Grid Components'
phase: 5
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
blocks:
  - 'task-5.4'
  - 'task-5.5'
  - 'task-5.6'
created_at: '2026-02-20'
---

# Create Recipe Card & Grid Components

## Current State

> Recipe types (`RecipeListItem`) and API routes exist from task-5.1. Layout components (header, footer, main layout) are complete. shadcn/ui components (card, badge, avatar, skeleton) are available. No recipe display components exist yet.

- **What exists**:
  - `src/types/recipe.ts` — `RecipeListItem`, `PaginatedResponse` types
  - `src/app/api/recipes/route.ts` — GET endpoint returning paginated recipe list
  - `src/components/ui/card.tsx`, `badge.tsx`, `avatar.tsx`, `skeleton.tsx` — shadcn/ui components
  - `src/components/shared/card-skeleton.tsx` — Existing card skeleton component
  - `lucide-react` icons installed
  - Tailwind CSS configured with dark mode support
  - `src/generated/prisma/client` — Enums: `Difficulty`, `Visibility`, `TagStatus`
- **What is missing**:
  - `src/components/recipes/recipe-card.tsx` — Pinterest-style recipe card
  - `src/components/recipes/recipe-grid.tsx` — Responsive masonry grid layout
- **Relevant code**:
  - `src/types/recipe.ts` — `RecipeListItem` type (card data shape)
  - `src/components/shared/card-skeleton.tsx` — Skeleton pattern reference
  - `docs/PRODUCT_MANAGER.md` — Pinterest-style card design requirements
  - `docs/ROADMAP.md` (lines 500-521) — Card and grid specs

---

## Desired Outcome

- **End state**: Two reusable display components — a recipe card and a responsive recipe grid — ready to be used on any page that lists recipes (dashboard, my-recipes, community, search, collection).
- **User-facing changes**: None yet — components exist but are not mounted on pages.
- **Developer-facing changes**:
  - `src/components/recipes/recipe-card.tsx` — Single recipe card component
  - `src/components/recipes/recipe-grid.tsx` — Grid container for recipe cards
  - `src/components/recipes/recipe-card-skeleton.tsx` — Loading skeleton for recipe card

---

## Scope & Boundaries

### In Scope

- Create Pinterest-style recipe card component displaying recipe summary data
- Create responsive masonry-style grid layout
- Create recipe card skeleton for loading states
- Support empty state in the grid ("No recipes found")
- Support "Load More" pagination trigger (the button/mechanism, not the data fetching logic)

### Out of Scope

- Tag toggle buttons on cards (Favorite, To Try, Made Before) — Phase 6
- Save button on cards — Phase 6
- Rating widget interaction on cards — Phase 8 (display-only average rating is in scope)
- Data fetching / React Query hooks — task-5.5
- Infinite scroll implementation — can be added later; "Load More" button is sufficient

### Dependencies

- Task-5.1 must be complete (types)

---

## Implementation Details

### Section 1: Recipe Card Component (`src/components/recipes/recipe-card.tsx`)

**What to do**: Create a card component that displays a recipe summary in Pinterest style.

**Where to find context**:

- `docs/ROADMAP.md` (lines 502-515) — Card spec
- `docs/PRODUCT_MANAGER.md` — Pinterest-style design, food-centric visual hierarchy
- `src/types/recipe.ts` — `RecipeListItem` type

**Specific requirements**:

Props: `recipe: RecipeListItem`

Card content (top to bottom):

1. **Primary image**: Display `recipe.primaryImage.url` if available. Show a styled fallback placeholder if no image (e.g., a food icon or gradient with recipe initial).
2. **Recipe title**: `recipe.name` — truncated to 2 lines with ellipsis
3. **Cuisine type badge**: `recipe.cuisineType` displayed as a badge
4. **Difficulty badge**: Color-coded — green for EASY, yellow/amber for MEDIUM, red for HARD
5. **Time display**: Prep time + cook time (e.g., "15 min prep | 30 min cook") — show total time if both exist
6. **Average rating**: Display stars (filled/empty) with rating count. Show "No ratings" if `avgRating` is null. Read-only display — not interactive.
7. **Author info**: Small avatar + username (or name if no username)
8. **Visibility indicator**: Icon only — lock for PRIVATE, users icon for SHARED, globe for PUBLIC. Subtle, bottom corner.

Visual treatment:

- Use shadcn/ui `Card` as the base
- Hover effect: subtle scale (1.02) and shadow increase
- Rounded corners, clean spacing
- Image aspect ratio: maintain natural ratio (masonry-friendly) or use a consistent 3:2 ratio
- Click on the card navigates to `/recipes/[id]` — wrap in Next.js `Link`
- Responsive: card takes full width of its grid column

**Patterns to follow**:

- Use `next/image` for recipe images (optimization, lazy loading)
- Use `next/link` for navigation
- Use `lucide-react` for icons (Clock, Star, Lock, Globe, Users, ChefHat)
- Follow existing component patterns in `src/components/layout/`

---

### Section 2: Recipe Card Skeleton (`src/components/recipes/recipe-card-skeleton.tsx`)

**What to do**: Create a skeleton loading state that matches the recipe card layout.

**Where to find context**:

- `src/components/shared/card-skeleton.tsx` — Existing skeleton pattern
- `src/components/ui/skeleton.tsx` — shadcn/ui Skeleton component

**Specific requirements**:

- Match the recipe card's visual layout:
  - Image placeholder (rectangle)
  - Title placeholder (two lines of varying width)
  - Badge placeholders (small rounded rectangles)
  - Time and rating placeholders
  - Author placeholder (small circle + line)
- Use shadcn/ui `Skeleton` component
- Animate with pulse effect

---

### Section 3: Recipe Grid Component (`src/components/recipes/recipe-grid.tsx`)

**What to do**: Create a responsive grid layout that displays recipe cards in a Pinterest/masonry style.

**Where to find context**:

- `docs/ROADMAP.md` (lines 516-521) — Grid spec
- `docs/PRODUCT_MANAGER.md` — Pinterest-style grid

**Specific requirements**:

Props:

- `recipes: RecipeListItem[]` — Array of recipes to display
- `isLoading?: boolean` — Show skeleton grid
- `skeletonCount?: number` — Number of skeleton cards to show (default 8)
- `emptyState?: { title: string; description: string; action?: { label: string; href: string } }` — Custom empty state config
- `hasMore?: boolean` — Whether more recipes can be loaded
- `onLoadMore?: () => void` — Callback for "Load More" button

Layout:

- Responsive columns: 1 (mobile < 640px) → 2 (sm 640px) → 3 (lg 1024px) → 4 (xl 1280px)
- Use CSS grid with `auto-rows` or CSS columns for masonry-like effect
- Consistent gap between cards

States:

1. **Loading**: Display `skeletonCount` skeleton cards in the grid
2. **Empty**: Display centered empty state with title, description, and optional CTA button (e.g., "No recipes found. Create your first recipe!")
3. **Data**: Display recipe cards in the grid
4. **Load More**: If `hasMore` is true, show a "Load More" button below the grid. When clicked, call `onLoadMore()`. Show a loading spinner on the button while loading.

**Patterns to follow**:

- Use Tailwind CSS grid utilities for the responsive layout
- Follow existing component patterns

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] Recipe card displays all required data: image, title, cuisine badge, difficulty badge, time, rating, author, visibility icon
- [ ] Recipe card shows fallback when no primary image exists
- [ ] Recipe card difficulty badge is color-coded (green/amber/red)
- [ ] Recipe card is clickable and links to `/recipes/[id]`
- [ ] Recipe card has hover effect (scale + shadow)
- [ ] Recipe card skeleton matches card layout
- [ ] Recipe grid is responsive: 1 col mobile, 2 col tablet, 3 col desktop, 4 col wide
- [ ] Recipe grid shows skeletons when `isLoading` is true
- [ ] Recipe grid shows empty state when `recipes` is empty
- [ ] Recipe grid shows "Load More" button when `hasMore` is true
- [ ] All components render correctly in both light and dark mode

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Components use `next/image` for recipe images

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

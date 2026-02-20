---
task_id: 'task-4.3'
title: 'Create Landing Page & Dashboard'
phase: 4
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-4.2'
blocks:
  - 'task-4.5'
created_at: '2026-02-19'
---

# Create Landing Page & Dashboard

## Current State

> Tasks 4.1 and 4.2 will have created the header, mobile navigation, footer, and `(main)` layout. The landing page at `src/app/page.tsx` exists but is a minimal placeholder with only an `<h1>` tag. No dashboard page exists. No API routes for fetching dashboard data exist yet (recipe APIs come in Phase 5), so dashboard content will use placeholder/static data or skeleton states.

- **What exists**:
  - `src/app/page.tsx` — Minimal placeholder: `<h1>Recipe Management System</h1>` in a centered flex container
  - `src/app/(main)/layout.tsx` — Main layout with Header + content area + Footer (created in task 4.2)
  - `src/app/(main)/` — Route group directory with layout
  - `src/lib/auth.ts` — NextAuth v5 config with `auth()` for server-side session retrieval
  - `src/providers/auth-provider.tsx` — Enables `useSession()` on client
  - `src/components/ui/card.tsx` — shadcn/ui Card component
  - `src/components/ui/button.tsx` — shadcn/ui Button component
  - `src/components/ui/skeleton.tsx` — shadcn/ui Skeleton component
  - `src/components/ui/badge.tsx` — shadcn/ui Badge component
  - `middleware.ts` — Redirects unauthenticated users from `/dashboard` to `/login`
  - `prisma/schema.prisma` — Full database schema (Recipe, User, etc.)
  - `src/lib/db.ts` — Prisma client singleton
- **What is missing**:
  - Updated `src/app/page.tsx` — Landing page for guests with hero, features, CTA; redirect to `/dashboard` for authenticated users
  - `src/app/(main)/dashboard/page.tsx` — Authenticated dashboard with welcome message, quick stats, recent recipes, quick actions
- **Relevant code**:
  - `docs/ROADMAP.md` lines 327-340 — Task 4.3 full requirements
  - `docs/SENIOR_DEVELOPER.md` lines 64-66 — Landing/dashboard specification
  - `docs/PRODUCT_MANAGER.md` lines 87-93 — Pinterest-style cards, clean design

---

## Desired Outcome

- **End state**: Guests visiting `/` see an attractive landing page with hero section, feature highlights, and "Get Started" CTA. Authenticated users visiting `/` are redirected to `/dashboard`. The dashboard shows a welcome message, placeholder quick stats cards, placeholder recent recipes section, and quick action buttons. Data-driven sections (stats, recipes) use skeleton loaders or empty states since recipe APIs don't exist yet.
- **User-facing changes**:
  - Guests see a polished landing page encouraging sign-up
  - Authenticated users land on a dashboard overview page
- **Developer-facing changes**:
  - Updated `src/app/page.tsx` — Landing page (server component with auth check for redirect)
  - `src/app/(main)/dashboard/page.tsx` — Dashboard page

---

## Scope & Boundaries

### In Scope

- Update `src/app/page.tsx` with landing page content for guests and redirect logic for authenticated users
- Create `src/app/(main)/dashboard/page.tsx` with dashboard layout
- Landing page: hero section with tagline and CTA, feature highlights (AI-powered, sharing, collections), responsive layout
- Dashboard: welcome message with user's name, quick stats cards (placeholders with 0 or skeleton), recent recipes section (empty state), quick action buttons (Add Recipe, Browse Community, View Collection)
- Use `auth()` from NextAuth for server-side auth detection on the landing page
- Use `redirect()` from `next/navigation` to redirect authenticated users from `/` to `/dashboard`
- Responsive design for both pages

### Out of Scope

- Actual data fetching for dashboard stats or recent recipes (recipe APIs come in Phase 5 — use placeholder/empty states)
- Featured recipes from seed data on landing page (recipe query APIs come in Phase 5 — use static preview cards or omit)
- Recipe card component (Phase 5 — Task 5.4)
- Recipe grid component (Phase 5 — Task 5.4)
- Loading, error, not-found pages (task 4.4)
- Community page (Phase 8)
- Any API route creation
- Tests (task 4.5)

### Dependencies

- Task 4.2 — Main layout with Header + Footer (dashboard sits inside `(main)` layout)
- Task 3.1 — `auth()` function for server-side session check
- Task 3.5 — Root providers
- `middleware.ts` — Already protects `/dashboard`

---

## Implementation Details

### Section 1: Landing Page (Unauthenticated)

**What to do**: Update `src/app/page.tsx` to be a landing page for guests with redirect for authenticated users.

**Where to find context**:

- `docs/ROADMAP.md` lines 328-333 — Landing page requirements
- `docs/SENIOR_DEVELOPER.md` lines 64-66 — Landing page spec (hero section, featured recipes, CTA)
- `docs/PRODUCT_MANAGER.md` lines 87-93 — Design principles

**Specific requirements**:

- Server component (no `"use client"`) — uses `auth()` for server-side session check
- If authenticated: `redirect("/dashboard")` using `next/navigation`
- If not authenticated, render landing page with:
  - **Hero section**:
    - Large tagline (e.g., "Your AI-Powered Recipe Kitchen")
    - Brief description of the app
    - "Get Started" button linking to `/login`
    - Visually appealing — consider gradient background or subtle pattern
  - **Feature highlights section** (3 cards or columns):
    - AI-Powered Cooking: "Generate recipes from ingredients, get substitutions, and estimate nutrition"
    - Share & Discover: "Share recipes with friends, browse community recipes, rate and comment"
    - Organize Your Collection: "Tag favorites, plan meals, create shopping lists"
  - **Call to action**: "Join thousands of home cooks" (or similar) with sign-up button
- Responsive: single column on mobile, multi-column features on desktop
- Does NOT use the `(main)` layout — it's a standalone page at the root with its own design
- Clean, appetizing design that makes a good first impression

**Patterns to follow**:

- Next.js App Router server component with `auth()` and `redirect()`
- Landing page pattern: full-width sections, no header/footer (standalone page for guests)
- Note: If the header/footer should also appear on the landing page for guests, wrap the content appropriately or import them directly. Evaluate based on task 4.1/4.2 implementation.

---

### Section 2: Dashboard Page (Authenticated)

**What to do**: Create `src/app/(main)/dashboard/page.tsx` — the authenticated user's home page.

**Where to find context**:

- `docs/ROADMAP.md` lines 334-340 — Dashboard requirements
- `docs/SENIOR_DEVELOPER.md` lines 64-66 — Dashboard spec (quick stats, recent recipes, quick actions)

**Specific requirements**:

- Server component that fetches the current user's session using `auth()`
- **Welcome section**: "Welcome back, {user.name}" greeting
- **Quick stats cards** (row of 3-4 cards):
  - Total Recipes: placeholder `0` (or query `prisma.recipe.count({ where: { authorId } })` if desired — this is a simple count, not a full recipe API)
  - Favorites: placeholder `0` (or query `prisma.userRecipeTag.count(...)`)
  - To Try: placeholder `0`
  - Note: It is acceptable to make basic count queries using the Prisma client directly from this server component, since these are simple aggregations — NOT full recipe list queries. If this feels like scope creep, use static `0` with a "No data yet" note.
- **Quick action buttons** (prominent CTAs):
  - "Add Recipe" → `/recipes/new` (primary button)
  - "Browse Community" → `/community` (secondary/outline button)
  - "View Collection" → `/my-collection` (secondary/outline button)
- **Recent recipes section**:
  - Empty state: "You haven't created any recipes yet. Get started by adding your first recipe!" with CTA
  - Note: The full recipe card grid comes in Phase 5. For now, show the empty state. If basic Prisma queries are used for stats, a simple list of recipe titles (last 5) could also be shown here — but a full RecipeCard component is out of scope.
- **Community highlights section** (optional, can be deferred):
  - Placeholder: "Top-rated community recipes will appear here" or omit entirely
- Use shadcn/ui `Card` components for stats and sections
- Use `Skeleton` components where data would be loading
- Responsive: stack cards on mobile, grid on desktop

**Patterns to follow**:

- Next.js App Router server component data fetching pattern (direct Prisma queries in server components)
- `docs/CTO_SPECS.md` line 62 — Prisma query-level caching
- shadcn/ui Card component patterns

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] Existing tests pass (`npm run test:run`)

### Functional Verification

- [ ] Unauthenticated users visiting `/` see the landing page
- [ ] Landing page has hero section with tagline and "Get Started" CTA
- [ ] Landing page has feature highlights section
- [ ] "Get Started" CTA links to `/login`
- [ ] Authenticated users visiting `/` are redirected to `/dashboard`
- [ ] Dashboard page shows welcome message with user's name
- [ ] Dashboard page shows quick stats cards (even if values are 0/placeholder)
- [ ] Dashboard page shows quick action buttons with correct links
- [ ] Quick action buttons navigate to correct routes (`/recipes/new`, `/community`, `/my-collection`)
- [ ] Dashboard page shows empty state for recent recipes
- [ ] Both pages are responsive (mobile, tablet, desktop)
- [ ] Dashboard is wrapped in the `(main)` layout (has header and footer)
- [ ] Landing page renders appropriately (standalone or with minimal chrome)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Server components used where possible (no unnecessary `"use client"`)
- [ ] Semantic HTML used (`<section>`, `<h1>`, `<h2>`, etc.)

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

- The `npm run test:run` script referenced in the acceptance criteria does not exist. The correct script is `npm test` (which runs `vitest run`).
- Pre-existing Turbopack build warnings about Edge Runtime and `node:path`/`node:url`/`node:buffer` in the Prisma generated client — these are from the middleware importing `auth.ts` → `db.ts` → Prisma client chain and are not caused by this task's changes.
- Quick action link targets (`/recipes/new`, `/community`, `/my-collection`) do not have page components yet — they will 404 until future phases implement them. Task 4.4 will add a proper not-found page.

---
task_id: 'task-12.2'
title: 'Frontend Performance'
phase: 12
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-12.1'
blocks:
  - 'task-13.1'
created_at: '2026-02-22'
---

# Frontend Performance

## Current State

> The application has a functional frontend with server and client components, but lacks performance optimizations for production deployment.

- **What exists**:
  - `next/image` is correctly used for all recipe images in `src/components/recipes/recipe-card.tsx`, `src/components/recipes/recipe-detail/recipe-hero.tsx`, and `src/components/recipes/recipe-detail/recipe-images.tsx`
  - Root-level `src/app/loading.tsx` for global loading fallback
  - Skeleton components: `src/components/recipes/recipe-card-skeleton.tsx`, `src/components/shared/page-skeleton.tsx`, `src/components/shared/card-skeleton.tsx`
  - Server Components used for: dashboard, recipe detail, recipe new/edit, share token page, landing page, login
  - Client Components used for: my-recipes, my-collection, search, community, shared-with-me, shopping lists
  - React Query DevTools imported unconditionally in `src/providers/query-provider.tsx`
  - `next.config.ts` is essentially empty (no `images.remotePatterns`, no security headers, no custom configuration)
- **What is missing**:
  - `images.remotePatterns` in `next.config.ts` for Cloudinary URLs (hard blocker for external images)
  - Dynamic imports (`next/dynamic`) for heavy components (recipe form wizard, AI features, cooking mode)
  - Route-level `loading.tsx` files for individual page segments
  - Hover prefetching on recipe cards
  - Security headers in `next.config.ts`
  - ReactQueryDevtools should be dev-only
  - Bundle analysis for identifying large chunks

**Relevant code**:

- `next.config.ts` — empty configuration
- `src/providers/query-provider.tsx` — unconditional DevTools import
- `src/components/recipes/recipe-card.tsx` — recipe card with `next/image`
- `src/components/recipes/recipe-form/recipe-form-wizard.tsx` — heavy form component
- `src/components/recipes/cooking-mode.tsx` — cooking mode overlay
- `src/components/recipes/cooking-timer.tsx` — timer component
- `src/components/ai/recipe-generator.tsx` — AI generation component

---

## Desired Outcome

- **End state**: External images render correctly via Cloudinary, heavy components are lazy-loaded, route-level loading states exist, DevTools are dev-only, security headers are configured, and bundle size is optimized.
- **User-facing changes**: Faster initial page loads, visible loading states during navigation, correctly rendered external images, security headers protecting against common attacks.
- **Developer-facing changes**:
  - `next.config.ts` fully configured for production (images, headers, bundle analysis)
  - `next/dynamic` wrappers for heavy components
  - Route-level `loading.tsx` files
  - DevTools conditionally loaded

---

## Scope & Boundaries

### In Scope

- Configure `images.remotePatterns` in `next.config.ts` for Cloudinary domains
- Add security headers in `next.config.ts` (`headers()` function): Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Add `next/dynamic` imports for heavy client components: recipe form wizard, cooking mode, cooking timer, AI components (recipe generator, substitution dialog, nutrition display)
- Create route-level `loading.tsx` files for key routes: `/dashboard`, `/recipes/[id]`, `/my-recipes`, `/my-collection`, `/search`, `/community`, `/shopping-lists`, `/shopping-lists/[id]`
- Make ReactQueryDevtools dev-only (dynamic import with `ssr: false` gated on `process.env.NODE_ENV`)
- Add hover prefetching on recipe cards using `router.prefetch()`
- Audit and optimize font loading (verify Inter or system font is loaded efficiently)
- Install `@next/bundle-analyzer` as dev dependency and add an `analyze` script to `package.json`
- Run `next build` and document bundle sizes in Notes section

### Out of Scope

- Converting existing client components to server components (would require significant refactoring)
- Implementing `next/image` blur placeholders for Cloudinary images (nice-to-have, not required)
- React Server Components refactoring beyond what already exists
- Database or API optimizations (task 12.1)
- Security hardening of API routes (task 12.3)
- Full Lighthouse audit with score targets (task 13.3 — Final QA)

### Dependencies

- Task 12.1 completed (API optimization must be done first to ensure stable API behavior)
- All Phase 10 components exist (cooking mode, shopping lists, print view)

---

## Implementation Details

### Section 1: Configure next.config.ts — Images & Security Headers

**What to do**: Fully configure `next.config.ts` for production use.

**Where to find context**:

- `next.config.ts` — currently empty
- `docs/CTO_SPECS.md`: Cloudinary for image storage, Vercel for deployment
- `.env.example`: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` variable

**Specific requirements**:

- Add `images.remotePatterns` for Cloudinary:
  ```typescript
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // for seed/placeholder images if used
      },
    ],
  }
  ```
- Add security headers via `headers()` async function:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`: configure for Next.js (allow `self`, inline scripts for Next.js, Cloudinary images, OpenAI API, Google/GitHub OAuth)
- Apply headers to all routes (`source: '/(.*)'`)

**Patterns to follow**:

- Per `docs/CTO_SPECS.md`: Cloudinary for images, Vercel deployment
- Follow Next.js official documentation for security headers configuration

---

### Section 2: Dynamic Imports for Heavy Components

**What to do**: Wrap heavy client components with `next/dynamic` to enable code splitting.

**Where to find context**:

- `src/components/recipes/recipe-form/recipe-form-wizard.tsx` — multi-step form wizard (large)
- `src/components/recipes/cooking-mode.tsx` — full-screen cooking overlay
- `src/components/recipes/cooking-timer.tsx` — timer with audio
- `src/components/ai/recipe-generator.tsx` — AI generation UI
- `src/components/ai/substitution-dialog.tsx` — AI substitution dialog
- `src/components/ai/nutrition-display.tsx` — AI nutrition display

**Specific requirements**:

- Use `next/dynamic` with `{ ssr: false }` for client-only components:
  - Cooking mode (`ssr: false` — uses browser APIs like Wake Lock, audio)
  - Cooking timer (`ssr: false` — uses browser Audio API)
  - Recipe generator (`ssr: false` — client-only streaming UI)
- Use `next/dynamic` with loading fallback for form wizard:
  - Recipe form wizard: dynamic with `loading: () => <RecipeFormSkeleton />` (create a simple skeleton)
- Apply dynamic imports at the **page level** where these components are consumed, not inside the components themselves
- Components that are already part of a client component tree and are small should NOT be dynamically imported (avoid over-splitting)

**Patterns to follow**:

- Per `docs/ROADMAP.md` Phase 12.2: "Dynamic imports for heavy components (recipe form wizard, AI features, cooking mode)"

---

### Section 3: Route-Level Loading States

**What to do**: Create `loading.tsx` files for key route segments to show instant loading feedback during navigation.

**Where to find context**:

- `src/app/loading.tsx` — existing root-level loading fallback
- `src/components/shared/page-skeleton.tsx` — existing page skeleton
- `src/components/recipes/recipe-card-skeleton.tsx` — existing card skeleton

**Specific requirements**:

- Create `loading.tsx` for these routes (reusing existing skeleton components):
  - `src/app/(main)/dashboard/loading.tsx` — dashboard page skeleton
  - `src/app/(main)/recipes/[id]/loading.tsx` — recipe detail skeleton (hero + metadata + ingredients/steps placeholder)
  - `src/app/(main)/my-recipes/loading.tsx` — recipe grid skeleton
  - `src/app/(main)/my-collection/loading.tsx` — collection page skeleton with tab placeholders
  - `src/app/(main)/search/loading.tsx` — search page skeleton
  - `src/app/(main)/community/loading.tsx` — community grid skeleton
  - `src/app/(main)/shopping-lists/loading.tsx` — shopping list skeleton
  - `src/app/(main)/shopping-lists/[id]/loading.tsx` — shopping list detail skeleton
- Each loading file should export a default component that renders an appropriate skeleton layout
- Keep skeletons simple — use existing `Skeleton` from shadcn/ui and existing skeleton components

**Patterns to follow**:

- Per `.claude/page-component-skill.md`: loading.tsx follows Next.js App Router conventions
- Reuse existing skeleton components; create new ones only if no suitable skeleton exists

---

### Section 4: ReactQueryDevtools — Dev-Only

**What to do**: Make React Query DevTools load only in development mode.

**Where to find context**:

- `src/providers/query-provider.tsx` — lines 2, 21: unconditional import and render of `ReactQueryDevtools`

**Specific requirements**:

- Use `next/dynamic` with `{ ssr: false }` to dynamically import `ReactQueryDevtools` only when `process.env.NODE_ENV === 'development'`
- Alternatively, conditionally render: `{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}` (but this still imports the module — dynamic import is preferred for bundle size)
- Verify DevTools are NOT included in production bundle by checking `next build` output

**Patterns to follow**:

- Standard Next.js pattern for dev-only tools

---

### Section 5: Recipe Card Hover Prefetching

**What to do**: Add `router.prefetch()` on recipe card hover to preload recipe detail pages.

**Where to find context**:

- `src/components/recipes/recipe-card.tsx` — recipe card component
- `docs/ROADMAP.md` Phase 12.2: "Prefetching on recipe card hover"

**Specific requirements**:

- Add `onMouseEnter` handler to recipe card that calls `router.prefetch(`/recipes/${recipe.id}`)`
- Use `useRouter()` from `next/navigation`
- Debounce or throttle prefetch calls (prefetch only after 150ms hover to avoid unnecessary prefetches on quick mouse movements)
- If the recipe card is already a client component, add directly; if it's a server component, convert only the link/wrapper to a client component or use a client wrapper
- Do NOT prefetch on mobile (prefetching on touch devices wastes bandwidth)

**Patterns to follow**:

- Use Next.js `useRouter().prefetch()` — the standard approach for programmatic prefetching

---

### Section 6: Bundle Analysis Setup

**What to do**: Install and configure `@next/bundle-analyzer` for production build analysis.

**Where to find context**:

- `package.json` — existing scripts
- `docs/ROADMAP.md` Phase 12.2: "Bundle size optimization (next build output)"

**Specific requirements**:

- Install `@next/bundle-analyzer` as a dev dependency
- Add `ANALYZE=true` environment variable support in `next.config.ts`
- Add script to `package.json`: `"analyze": "ANALYZE=true next build"`
- Run the analyzer and document findings in the Notes section (which chunks are largest, any unexpected dependencies)
- No bundle size changes required — this section is about setting up the tooling and documenting findings

**Patterns to follow**:

- Standard `@next/bundle-analyzer` configuration pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] External Cloudinary images render correctly in recipe cards and detail pages
- [ ] Security headers are present in HTTP responses (verify with browser DevTools network tab)
- [ ] Cooking mode, cooking timer, and AI components load lazily (verify with browser DevTools network tab — separate chunks)
- [ ] Route-level loading states appear during navigation
- [ ] ReactQueryDevtools do NOT appear in production build
- [ ] Recipe card hover triggers prefetch of the recipe detail page
- [ ] Bundle analyzer generates a report when run with `ANALYZE=true`

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration (e.g., Cloudinary hostname)
- [ ] No TODO/FIXME comments left unresolved within this task's scope

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

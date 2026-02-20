---
task_id: 'task-4.2'
title: 'Create Main App Layout & Footer'
phase: 4
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-4.1'
blocks:
  - 'task-4.3'
  - 'task-4.5'
created_at: '2026-02-19'
---

# Create Main App Layout & Footer

## Current State

> Task 4.1 will have created the header and mobile navigation components. The `(main)` route group directory exists under `src/app/` but contains only a `.gitkeep` placeholder — no layout wrapping authenticated pages has been built. No footer component exists.

- **What exists**:
  - `src/app/(main)/` — Route group directory (`.gitkeep` only, no `layout.tsx`)
  - `src/app/layout.tsx` — Root layout with providers (ThemeProvider, AuthProvider, QueryProvider, Toaster)
  - `src/components/layout/header.tsx` — Header component (created in task 4.1)
  - `src/components/layout/mobile-nav.tsx` — Mobile navigation (created in task 4.1)
  - `src/components/layout/` — Directory with header and mobile-nav from task 4.1
  - `src/components/ui/separator.tsx` — shadcn/ui Separator component
  - `middleware.ts` — Route protection already configured for `/dashboard`, `/my-recipes`, `/my-collection`, `/shopping-lists`, `/settings`, `/shared-with-me`
- **What is missing**:
  - `src/components/layout/footer.tsx` — Application footer
  - `src/app/(main)/layout.tsx` — Layout component wrapping all authenticated pages with Header + main content + Footer
- **Relevant code**:
  - `docs/ROADMAP.md` lines 312-324 — Task 4.2 full requirements
  - `docs/SENIOR_DEVELOPER.md` lines 59-63 — Layout component specs (Header, Navigation, Footer)

---

## Desired Outcome

- **End state**: A `(main)` route group layout wraps all authenticated pages with the Header at the top, a responsive main content area with proper padding/max-width, and a Footer at the bottom. All pages under `src/app/(main)/` automatically receive this consistent shell.
- **User-facing changes**: Authenticated users see a consistent app shell with header navigation at top and footer at bottom. Content area is properly contained and responsive.
- **Developer-facing changes**:
  - `src/components/layout/footer.tsx` — Footer component
  - `src/app/(main)/layout.tsx` — Main layout composing Header, content area, Footer

---

## Scope & Boundaries

### In Scope

- Create `src/components/layout/footer.tsx` with copyright, links, attribution
- Create `src/app/(main)/layout.tsx` wrapping children with Header, main content container, and Footer
- Responsive main content area with max-width and centered content
- Proper vertical layout: header → content (flex-grow) → footer (at bottom)
- Ensure the layout fills at least the full viewport height (no floating footer)

### Out of Scope

- Landing page content (task 4.3)
- Dashboard page content (task 4.3)
- Loading/error/not-found pages (task 4.4)
- Theme toggle component (task 4.4)
- Any API routes or data fetching
- Tests (task 4.5)
- Modifying the root `src/app/layout.tsx` (already configured in task 3.5)

### Dependencies

- Task 4.1 — Header and mobile navigation components
- Task 3.5 — Root providers configured
- shadcn/ui components installed

---

## Implementation Details

### Section 1: Footer Component

**What to do**: Create `src/components/layout/footer.tsx` — a minimal application footer.

**Where to find context**:

- `docs/ROADMAP.md` lines 315-318 — Footer requirements

**Specific requirements**:

- Copyright notice with current year (e.g., "2026 Recipe Management System")
- Links: About, Privacy, Terms (can be placeholder `#` hrefs for now — actual pages are not in scope for any current phase)
- "Built with Next.js" or similar brief attribution
- Keep it minimal and unobtrusive
- Responsive: stack links vertically on mobile, horizontal on desktop
- Use `Separator` component above the footer for visual distinction
- Muted text color to not draw attention away from main content

**Patterns to follow**:

- Standard footer pattern: centered container, muted styling
- `docs/SENIOR_DEVELOPER.md` — Component naming conventions

---

### Section 2: Main App Layout

**What to do**: Create `src/app/(main)/layout.tsx` — the layout wrapper for all authenticated app pages.

**Where to find context**:

- `docs/ROADMAP.md` lines 319-324 — Main layout requirements
- `docs/SENIOR_DEVELOPER.md` line 64 — `/` landing/dashboard specification

**Specific requirements**:

- Import and render the `Header` component at the top
- Main content area wrapped in a container:
  - `<main>` element with proper semantic HTML
  - Max-width container (e.g., `max-w-7xl mx-auto`) centered on the page
  - Responsive horizontal padding: `px-4 sm:px-6 lg:px-8`
  - Vertical padding for content breathing room: `py-6` or `py-8`
- Import and render the `Footer` component at the bottom
- Use flexbox column layout with `min-h-screen` to ensure footer stays at bottom:
  ```
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-1 ...">
      {children}
    </main>
    <Footer />
  </div>
  ```
- This is a server component (no `"use client"` needed — it only composes other components)
- The `(main)` route group does NOT affect the URL path — it's purely organizational

**Patterns to follow**:

- Next.js App Router route group layout pattern
- Responsive container pattern from Tailwind CSS documentation
- `docs/CTO_SPECS.md` line 44 — Layout uses CSS Grid/responsive

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] Existing tests pass (`npm run test:run`)

### Functional Verification

- [ ] Footer renders with copyright text, links, and attribution
- [ ] `(main)` layout wraps children with Header, content area, and Footer
- [ ] Header appears at the top of all `(main)` pages
- [ ] Footer appears at the bottom of all `(main)` pages
- [ ] Footer stays at the bottom even with minimal content (flex-col min-h-screen)
- [ ] Content area is properly contained with max-width and centered
- [ ] Content area has responsive horizontal padding
- [ ] Layout is responsive: proper spacing at mobile, tablet, and desktop widths
- [ ] Layout does not affect auth pages (`(auth)/login`, `(auth)/onboarding`) — those remain outside `(main)`

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Semantic HTML: `<main>`, `<footer>` elements used appropriately
- [ ] Layout is a server component (no unnecessary `"use client"`)

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

- The task file references `npm run test:run` but the actual script name is `npm test` (which runs `vitest run`). Future task files should use `npm test` instead.
- The 3 Turbopack build warnings about Prisma's Node.js module usage in Edge Runtime are pre-existing (from middleware/auth setup) and unrelated to this task.

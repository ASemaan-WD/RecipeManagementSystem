---
task_id: 'task-4.4'
title: 'Create Loading, Error States & Dark Mode Toggle'
phase: 4
task_number: 4
status: 'done'
priority: 'medium'
dependencies:
  - 'task-4.1'
  - 'task-4.2'
blocks:
  - 'task-4.5'
created_at: '2026-02-19'
---

# Create Loading, Error States & Dark Mode Toggle

## Current State

> Tasks 4.1 and 4.2 will have created the header (with a placeholder slot for the dark mode toggle), mobile navigation, footer, and main layout. The ThemeProvider is already configured in task 3.5 (attribute="class", defaultTheme="system"), and dark mode CSS variables are fully defined in `globals.css`. However, there is no UI toggle to switch themes, and no global loading/error/not-found pages exist.

- **What exists**:
  - `src/providers/theme-provider.tsx` — ThemeProvider configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
  - `src/app/globals.css` — Complete light/dark mode CSS variables using oklch color space, `.dark` class selector
  - `src/components/ui/skeleton.tsx` — shadcn/ui Skeleton primitive component
  - `src/components/ui/button.tsx` — shadcn/ui Button component
  - `src/components/ui/card.tsx` — shadcn/ui Card component
  - `src/components/ui/alert.tsx` — shadcn/ui Alert component
  - `src/components/layout/header.tsx` — Header with placeholder slot for theme toggle (created in task 4.1)
  - `src/components/layout/mobile-nav.tsx` — Mobile nav with placeholder area for theme toggle (created in task 4.1)
  - `lucide-react@^0.574.0` — Icons (Sun, Moon, etc.)
  - `next-themes@^0.4.6` — Provides `useTheme()` hook
- **What is missing**:
  - `src/components/layout/theme-toggle.tsx` — Dark mode toggle button
  - `src/app/loading.tsx` — Global loading fallback
  - `src/app/error.tsx` — Global error boundary
  - `src/app/not-found.tsx` — Custom 404 page
  - Reusable skeleton patterns for common loading states
- **Relevant code**:
  - `docs/ROADMAP.md` lines 342-352 — Task 4.4 full requirements
  - `docs/SENIOR_DEVELOPER.md` lines 596-599 — Dark mode spec (ThemeProvider, toggle, localStorage persistence)
  - `docs/ROADMAP.md` line 348 — `attribute="class"` and `defaultTheme="system"`

---

## Desired Outcome

- **End state**: A theme toggle button exists in the header dropdown and mobile nav, allowing users to switch between light, dark, and system themes. Global loading, error, and 404 pages provide graceful fallbacks. Reusable skeleton loading patterns are available for common layouts (page skeleton, card skeleton, list skeleton).
- **User-facing changes**:
  - Users can toggle dark mode via a button in the header dropdown and mobile nav
  - Users see a loading skeleton during page transitions
  - Users see a helpful error page if something goes wrong
  - Users see a custom 404 page for invalid URLs
- **Developer-facing changes**:
  - `src/components/layout/theme-toggle.tsx` — Theme toggle component
  - `src/app/loading.tsx` — Global loading page
  - `src/app/error.tsx` — Global error boundary
  - `src/app/not-found.tsx` — Custom 404 page
  - `src/components/shared/page-skeleton.tsx` — Reusable page-level skeleton
  - `src/components/shared/card-skeleton.tsx` — Reusable card skeleton
  - Integration of theme toggle into header dropdown and mobile nav

---

## Scope & Boundaries

### In Scope

- Create theme toggle component using `useTheme()` from `next-themes`
- Integrate theme toggle into the header's user dropdown menu and mobile nav
- Create global `loading.tsx` with skeleton-based loading UI
- Create global `error.tsx` with error recovery UI (client component with "Try Again" button)
- Create `not-found.tsx` with helpful 404 page and navigation links
- Create reusable skeleton components for page and card patterns
- Verify all shadcn/ui components and custom styles respect dark mode

### Out of Scope

- Per-route loading states (those are added per-page as needed in future phases)
- Route-specific error boundaries (future phases as needed)
- Dark mode color variable changes (already complete in `globals.css`)
- ThemeProvider configuration changes (already complete in task 3.5)
- Tests (task 4.5)

### Dependencies

- Task 4.1 — Header component with slot for theme toggle
- Task 4.2 — Main layout and footer
- Task 3.5 — ThemeProvider configured
- `next-themes` installed, `globals.css` dark mode variables defined

---

## Implementation Details

### Section 1: Theme Toggle Component

**What to do**: Create `src/components/layout/theme-toggle.tsx` — a button that cycles through light/dark/system themes.

**Where to find context**:

- `docs/ROADMAP.md` lines 348-351 — Theme toggle requirements
- `docs/SENIOR_DEVELOPER.md` lines 596-599 — Dark mode toggle spec
- `next-themes` documentation for `useTheme()` hook

**Specific requirements**:

- Mark as `"use client"` (uses `useTheme()` hook)
- Import `useTheme` from `next-themes`
- Display sun icon in dark mode, moon icon in light mode (from `lucide-react`)
- Clicking toggles between light and dark (or use a dropdown with Light/Dark/System options)
- Handle hydration: the component should not render icons until mounted (use `useEffect` + `useState` to detect mount, or render a placeholder during SSR to avoid hydration mismatch)
- `next-themes` automatically persists the preference in `localStorage`
- Two integration points:
  1. In the header's user dropdown menu (as a menu item or sub-menu)
  2. In the mobile nav drawer (as a toggle button)
- Accessible: proper `aria-label` (e.g., "Toggle theme")

**Patterns to follow**:

- shadcn/ui dark mode toggle pattern
- Hydration-safe pattern: only render theme-dependent icons after client mount

---

### Section 2: Update Header & Mobile Nav with Theme Toggle

**What to do**: Integrate the theme toggle component into the header dropdown menu and mobile navigation.

**Where to find context**:

- `src/components/layout/header.tsx` — Header with placeholder slot (created in task 4.1)
- `src/components/layout/mobile-nav.tsx` — Mobile nav with placeholder area (created in task 4.1)

**Specific requirements**:

- In header dropdown: add the theme toggle as a menu item (between Settings and Sign Out, or in its own section)
- In mobile nav: add the theme toggle in the settings/preference area
- Ensure the toggle works correctly in both locations
- Do not break existing header/mobile-nav functionality

**Patterns to follow**:

- shadcn/ui DropdownMenuItem pattern for the header integration
- Consistent placement in both desktop and mobile navigation

---

### Section 3: Global Loading Page

**What to do**: Create `src/app/loading.tsx` — the global loading fallback shown during page navigation.

**Where to find context**:

- `docs/ROADMAP.md` line 346 — Global loading fallback
- Next.js App Router `loading.tsx` documentation

**Specific requirements**:

- Next.js automatically shows this during route transitions (Suspense boundary)
- Display a skeleton-based loading UI (not a spinner):
  - Skeleton header area (already rendered by layout, so just the content area)
  - A few skeleton card shapes to suggest content is loading
  - Centered in the content area
- Keep it simple and fast — this is a brief transition state
- Use the shadcn/ui `Skeleton` component

**Patterns to follow**:

- Next.js App Router `loading.tsx` convention
- Skeleton loading pattern (preferred over spinners per `docs/ROADMAP.md` line 1195)

---

### Section 4: Global Error Boundary

**What to do**: Create `src/app/error.tsx` — the global error boundary.

**Where to find context**:

- `docs/ROADMAP.md` line 346 — Global error boundary
- Next.js App Router `error.tsx` documentation

**Specific requirements**:

- Must be a client component (`"use client"`) — Next.js requirement for error boundaries
- Receives `error` and `reset` props from Next.js
- Display:
  - Error icon or illustration
  - Heading: "Something went wrong"
  - Brief message: "We encountered an unexpected error. Please try again."
  - "Try Again" button that calls `reset()` to retry rendering
  - "Go Home" link to `/dashboard` or `/`
- Do NOT display the actual error message to the user (security — log it instead)
- `console.error(error)` for development debugging
- Use `useEffect` to log the error on mount
- Clean, centered layout with appropriate spacing

**Patterns to follow**:

- Next.js App Router `error.tsx` convention (client component with `error` and `reset` props)
- `docs/SENIOR_DEVELOPER.md` — Never expose internal errors to users

---

### Section 5: Custom 404 Page

**What to do**: Create `src/app/not-found.tsx` — a custom 404 page.

**Where to find context**:

- `docs/ROADMAP.md` line 346 — Custom 404 page
- Next.js App Router `not-found.tsx` documentation

**Specific requirements**:

- Display:
  - Large "404" text
  - Heading: "Page not found"
  - Message: "The page you're looking for doesn't exist or has been moved."
  - Helpful navigation links:
    - "Go to Dashboard" → `/dashboard`
    - "Browse Community" → `/community`
    - "Go Home" → `/`
- Clean, centered layout
- Can be a server component (no client-side interactivity needed)

**Patterns to follow**:

- Next.js App Router `not-found.tsx` convention

---

### Section 6: Reusable Skeleton Components

**What to do**: Create reusable skeleton loading patterns for common UI structures.

**Where to find context**:

- `docs/ROADMAP.md` line 347 — Reusable loading skeleton components
- `src/components/ui/skeleton.tsx` — Base shadcn/ui Skeleton primitive

**Specific requirements**:

- Create `src/components/shared/page-skeleton.tsx`:
  - Composes multiple `Skeleton` components to represent a typical page layout
  - Header-like skeleton bar, content area skeletons
  - Reusable across different pages
- Create `src/components/shared/card-skeleton.tsx`:
  - Represents a single recipe card in loading state
  - Image placeholder (rectangle), title skeleton, metadata skeletons (prep time, rating badges)
  - Can be used in grids to show multiple loading cards
- Both should accept optional `className` prop for customization
- These are building blocks — composed into specific loading states in future phases

**Patterns to follow**:

- shadcn/ui Skeleton composition pattern
- `docs/ROADMAP.md` line 1195 — Skeletons, not spinners

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] No hydration mismatch warnings from theme toggle
- [ ] Existing tests pass (`npm run test:run`)

### Functional Verification

- [ ] Theme toggle renders in header dropdown menu
- [ ] Theme toggle renders in mobile navigation
- [ ] Clicking theme toggle switches between light and dark modes
- [ ] Theme preference persists across page reloads (localStorage)
- [ ] System theme option works (follows OS preference)
- [ ] All shadcn/ui components render correctly in both light and dark modes
- [ ] Global loading page shows skeleton UI during route transitions
- [ ] Global error page displays "Something went wrong" with "Try Again" button
- [ ] "Try Again" button on error page calls `reset()` and attempts recovery
- [ ] Custom 404 page displays with helpful navigation links
- [ ] Navigating to a nonexistent route shows the 404 page
- [ ] Page skeleton and card skeleton components render correctly
- [ ] No flash of unstyled content (FOUC) during theme changes

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Theme toggle handles hydration correctly (no SSR/CSR mismatch)
- [ ] Error boundary does not expose internal error details to users

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

- The test script in `package.json` is `npm test` (aliased to `vitest run`), not `npm run test:run` as referenced in the acceptance criteria.
- Pre-existing build warnings exist from Prisma client imports in Edge Runtime (node:path, node:url, node:buffer) — unrelated to this task.
- Removed `.gitkeep` from `src/components/shared/` since the directory now contains real component files.

---
task_id: 'task-10.3'
title: 'Print View & UX Polish'
phase: 10
task_number: 3
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-10.1'
  - 'task-10.2'
  - 'task-8.4'
blocks:
  - 'task-11.2'
  - 'task-12.2'
created_at: '2026-02-22'
---

# Print View & UX Polish

## Current State

> The application has all major features implemented (Phases 1-9, 10.1, 10.2). However, there is no print-friendly recipe view, no comprehensive responsive audit has been performed, error handling is not uniformly consistent across all routes, and accessibility has not been formally reviewed.

- **What exists**:
  - Recipe detail page at `src/app/(main)/recipes/[id]/page.tsx` with full recipe rendering (hero, metadata, ingredients, steps, nutrition, comments)
  - `RecipeActions` component at `src/components/recipes/recipe-detail/recipe-actions.tsx` with edit, delete, duplicate, share actions — but no print button
  - Global CSS at `src/app/globals.css` with Tailwind v4 theme variables, no `@media print` rules
  - shadcn/ui components across the app with dark mode support via `next-themes`
  - Layout components: `header.tsx`, `footer.tsx`, `mobile-nav.tsx` at `src/components/layout/`
  - Error pages: `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx`
  - Loading skeletons: `src/components/shared/card-skeleton.tsx`, `src/components/shared/page-skeleton.tsx`
  - Toast notifications via `sonner` (already integrated)
  - All API routes returning proper HTTP status codes (verified across Phases 3-9)
- **What is missing**:
  - `src/components/recipes/print-view.tsx` — print-friendly recipe component
  - CSS `@media print` styles in `src/app/globals.css`
  - "Print Recipe" button in recipe detail actions
  - Comprehensive responsive audit across all pages
  - Formal accessibility audit (ARIA labels, keyboard navigation, focus management, color contrast)
  - Consistent error handling review across all API routes
  - Skip navigation link
- **Relevant code**:
  - `src/app/(main)/recipes/[id]/page.tsx` — recipe detail page (integration target for print button)
  - `src/components/recipes/recipe-detail/recipe-actions.tsx` — action buttons area
  - `src/app/globals.css` — global styles (add print styles here)
  - `src/components/layout/header.tsx` — navigation header
  - `src/components/layout/mobile-nav.tsx` — mobile navigation
  - `src/app/layout.tsx` — root layout (add skip navigation link)

---

## Desired Outcome

- **End state**: Users can print a clean, well-formatted recipe. The application is responsive across mobile, tablet, and desktop. All interactive elements are keyboard-accessible with proper ARIA labels. Error handling is consistent across all API routes. Color contrast meets WCAG AA.
- **User-facing changes**:
  - "Print Recipe" button on recipe detail page
  - Printing shows only recipe content (no nav, buttons, sidebar, footer)
  - Responsive design works correctly at all breakpoints (mobile/tablet/desktop)
  - Keyboard navigation works throughout the app (Tab, Enter, Escape, Arrow keys)
  - Focus indicators visible on all interactive elements
  - Skip navigation link available
  - All images have meaningful alt text
- **Developer-facing changes**:
  - New file: `src/components/recipes/print-view.tsx` — print-friendly layout component
  - Modified: `src/app/globals.css` — added `@media print` styles
  - Modified: `src/components/recipes/recipe-detail/recipe-actions.tsx` — added print button
  - Modified: `src/app/layout.tsx` — added skip navigation link
  - Various components modified with ARIA attributes, keyboard handlers, and responsive fixes
  - New tests for print view rendering

---

## Scope & Boundaries

### In Scope

- Print-friendly recipe view component with CSS `@media print` styles
- "Print Recipe" button integrated into recipe detail page
- Responsive design audit and fixes across all pages (mobile < 640px, tablet 640-1024px, desktop > 1024px)
- Accessibility improvements: ARIA labels on interactive elements, keyboard navigation, focus management, skip navigation link, alt text on images, form error announcements
- Error handling consistency review: verify all API routes return proper status codes, toast notifications for user actions
- Consistent skeleton loading states across pages

### Out of Scope

- URL recipe import (listed as "nice-to-have" in roadmap — defer)
- Rewriting existing components from scratch (only fix issues found in audit)
- Adding new features beyond what's listed
- Performance optimization (Task 12.2)
- Security hardening (Task 12.3)
- Database query optimization (Task 12.1)
- WCAG AAA compliance (aim for AA only)

### Dependencies

- Task 10.1 (Recipe Scaling & Cooking Mode) — **must be complete** so print view can include scaling state and cooking mode is accessible
- Task 10.2 (Shopping List Feature) — **must be complete** so responsive audit includes shopping list pages
- Task 8.4 (Social integration into recipe detail) — **verified: complete**

---

## Implementation Details

### Section 1: Print View Component & CSS

**What to do**: Create a print-friendly recipe layout and add `@media print` CSS rules to hide non-printable elements.

**Where to find context**:

- `docs/ROADMAP.md` lines 878-881 — print view requirements
- `src/app/globals.css` — existing global styles
- `src/app/(main)/recipes/[id]/page.tsx` — recipe detail structure

**Specific requirements**:

**`src/components/recipes/print-view.tsx`**:

- This is NOT a separate page. It's a wrapper/utility that ensures recipe content prints well.
- Approach: use CSS `@media print` to control what's visible when printing, plus a "Print Recipe" button that calls `window.print()`.
- The component renders a print-optimized version of the recipe that is normally hidden (visible only in print media).
- Content to include in print: recipe title, primary image (small), metadata (prep time, cook time, servings, difficulty, cuisine), dietary tags, ingredients list (no checkboxes), instructions (numbered), nutrition data (if available)
- Content to exclude in print: navigation, header, footer, buttons, interactive elements, comments, ratings widget, share dialog, AI features, cooking mode

**`src/app/globals.css` additions**:

```css
@media print {
  /* Hide non-printable elements */
  .no-print,
  header,
  footer,
  nav,
  button:not(.print-trigger),
  [role='dialog'],
  [data-slot='toast'] {
    display: none !important;
  }

  /* Print-friendly layout */
  body {
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }

  /* Ensure images print */
  img {
    max-width: 100%;
    page-break-inside: avoid;
  }

  /* Prevent orphan headings */
  h1,
  h2,
  h3 {
    page-break-after: avoid;
  }

  /* Clean link display */
  a {
    color: #000;
    text-decoration: none;
  }
}
```

- Add `no-print` class to elements that should be hidden during print (header, footer, action buttons, etc.)
- Ensure the recipe content section doesn't have `no-print` class

**Patterns to follow**:

- Minimal component — mostly CSS-driven
- Follow `.claude/shared-component-skill.md` for the print button component

---

### Section 2: Print Button Integration

**What to do**: Add a "Print Recipe" button to the recipe detail actions area.

**Where to find context**:

- `src/components/recipes/recipe-detail/recipe-actions.tsx` — existing actions
- `src/app/(main)/recipes/[id]/page.tsx` (lines 213-236) — action buttons area

**Specific requirements**:

- Add a `PrintRecipeButton` (client component) that calls `window.print()` on click
- Icon: `Printer` from `lucide-react`
- Position: alongside existing action buttons in `RecipeActions` or adjacent to them
- Visible to all users (owners and viewers, authenticated and guests)
- Add `no-print` class to the button itself so it doesn't appear in the printout

**Patterns to follow**:

- Follow the button pattern used in `RecipeActions`

---

### Section 3: Responsive Design Audit & Fixes

**What to do**: Audit all pages at mobile (< 640px), tablet (640-1024px), and desktop (> 1024px) breakpoints and fix issues.

**Where to find context**:

- `docs/ROADMAP.md` lines 882-886 — responsive requirements
- `src/components/layout/header.tsx` — desktop navigation
- `src/components/layout/mobile-nav.tsx` — mobile navigation

**Specific requirements**:

- Audit the following pages for responsive issues:
  - Landing page (`src/app/page.tsx`)
  - Dashboard (`src/app/(main)/dashboard/page.tsx`)
  - My Recipes (`src/app/(main)/my-recipes/page.tsx`)
  - My Collection (`src/app/(main)/my-collection/page.tsx`)
  - Recipe detail (`src/app/(main)/recipes/[id]/page.tsx`)
  - Recipe create/edit (`src/app/(main)/recipes/new/page.tsx`, `src/app/(main)/recipes/[id]/edit/page.tsx`)
  - Search results (`src/app/(main)/search/page.tsx`)
  - Community (`src/app/(main)/community/page.tsx`)
  - Shopping lists (`src/app/(main)/shopping-lists/page.tsx`, `src/app/(main)/shopping-lists/[id]/page.tsx`)
  - Shared with me (`src/app/(main)/shared-with-me/page.tsx`)
  - AI generate (`src/app/(main)/ai/generate/page.tsx`)
- Fix common responsive issues:
  - Text overflow/truncation on small screens
  - Grid columns: 1 (mobile) → 2 (tablet) → 3-4 (desktop)
  - Ensure minimum 44px touch targets on all interactive elements on mobile
  - Check that mobile navigation (Sheet) works correctly on all pages
  - Verify form inputs are usable on mobile (proper spacing, font sizes ≥ 16px to prevent iOS zoom)
  - Ensure dialogs/modals are scrollable on small screens
  - Check image sizes and aspect ratios at different breakpoints

**Patterns to follow**:

- Mobile-first responsive approach using Tailwind breakpoints (`sm`, `md`, `lg`, `xl`)
- Use existing responsive patterns from `recipe-grid.tsx` as reference

---

### Section 4: Accessibility Improvements

**What to do**: Add ARIA attributes, keyboard navigation, focus management, and other accessibility features.

**Where to find context**:

- `docs/ROADMAP.md` lines 888-889 — accessibility requirements

**Specific requirements**:

- **Skip navigation link**: Add to `src/app/layout.tsx` as the first focusable element — visually hidden until focused, links to `#main-content`. Add `id="main-content"` to the main content area in `src/app/(main)/layout.tsx`.
- **ARIA labels**: Audit and add `aria-label` attributes to:
  - Icon-only buttons (search, hamburger menu, theme toggle, close buttons)
  - Navigation sections (`<nav aria-label="Main navigation">`)
  - Form inputs that lack visible labels
  - Star rating widget (e.g., `aria-label="Rate this recipe"`)
  - Interactive cards (recipe cards as links)
- **Keyboard navigation**:
  - Ensure all interactive elements are reachable via Tab
  - Escape key closes dialogs and modals (verify shadcn/ui already handles this)
  - Star rating: arrow keys to change value
  - Recipe grid: cards are focusable with visible focus ring
- **Focus management**:
  - Visible focus indicators on all interactive elements (verify Tailwind `focus-visible:ring` classes)
  - After dialog close, return focus to trigger element
  - After form submission, focus moves to success message or next logical element
- **Alt text**: Ensure all `<img>` and `next/image` elements have meaningful `alt` attributes:
  - Recipe images: `alt="{recipe name}"` or `alt="Photo of {recipe name}"`
  - User avatars: `alt="{user name}'s avatar"`
  - Decorative images: `alt=""`
- **Form error announcements**: Verify that form validation errors use `aria-describedby` linking to error messages, or `aria-invalid="true"` on invalid fields

**Patterns to follow**:

- Semantic HTML (headings hierarchy, landmarks, lists)
- WCAG AA standard: minimum 4.5:1 contrast ratio for normal text, 3:1 for large text

---

### Section 5: Error Handling Consistency

**What to do**: Review all API routes for consistent error handling and ensure toast notifications cover all user actions.

**Where to find context**:

- `docs/ROADMAP.md` lines 887 — error handling requirements
- All API route files under `src/app/api/`

**Specific requirements**:

- Audit all API routes to verify consistent HTTP status codes:
  - 400 for validation errors (Zod safeParse failures)
  - 401 for unauthenticated requests
  - 403 for unauthorized access (not owner, etc.)
  - 404 for not-found resources
  - 429 for rate limit exceeded (AI routes)
  - 500 for unexpected server errors
- Verify all API routes have try/catch blocks with generic 500 error response (no stack trace leak)
- Audit client-side hooks for error handling: verify toast notifications on mutation errors
- Verify loading states: all pages with data fetching show skeleton loaders
- Verify empty states: all list pages show helpful empty state messages
- Fix any inconsistencies found

**Patterns to follow**:

- Follow existing error handling pattern in `src/app/api/recipes/route.ts`
- Use `sonner` toast for client-side error notifications

---

### Section 6: Tests

**What to do**: Write tests for print view rendering and responsive behavior.

**Where to find context**:

- `src/test/setup.ts` — test setup
- `src/test/factories.ts` — mock data factories
- `.claude/test-file-skill.md` — canonical test pattern

**Specific requirements**:

- `src/components/recipes/__tests__/print-view.test.tsx`:
  - Print button renders on recipe detail
  - Print button calls `window.print()` when clicked
  - Print-relevant content has correct classes (not `no-print`)
  - Non-print elements have `no-print` class
- Verify the skip navigation link renders and is keyboard-accessible
- Verify ARIA labels are present on key interactive elements

**Patterns to follow**:

- Follow `.claude/test-file-skill.md` conventions
- Use `@testing-library/react` for rendering and assertions
- Mock `window.print` with `vi.fn()`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] "Print Recipe" button appears on recipe detail page
- [ ] Clicking print opens browser print dialog
- [ ] Print preview shows recipe content only (no nav, buttons, footer)
- [ ] Print output includes: title, image, metadata, ingredients, steps, nutrition
- [ ] Print output excludes: header, footer, comments, ratings widget, action buttons
- [ ] All pages render correctly at mobile viewport (< 640px)
- [ ] All pages render correctly at tablet viewport (640-1024px)
- [ ] All pages render correctly at desktop viewport (> 1024px)
- [ ] Touch targets are at least 44px on mobile
- [ ] Skip navigation link is available and works (Tab from page start)
- [ ] Icon-only buttons have ARIA labels
- [ ] Star rating is keyboard-accessible
- [ ] All recipe images have meaningful alt text
- [ ] Dialogs close with Escape key
- [ ] Focus returns to trigger after dialog close
- [ ] Form validation errors are announced to screen readers
- [ ] All API routes return consistent HTTP status codes

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Print styles use `@media print` and don't affect screen display
- [ ] ARIA attributes are semantic and accurate

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

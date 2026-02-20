---
task_id: 'task-4.5'
title: 'Write Tests for Layout & Navigation'
phase: 4
task_number: 5
status: 'done'
priority: 'medium'
dependencies:
  - 'task-4.1'
  - 'task-4.2'
  - 'task-4.3'
  - 'task-4.4'
blocks:
  - 'task-5.1'
created_at: '2026-02-19'
---

# Write Tests for Layout & Navigation

## Current State

> Tasks 4.1-4.4 will have created the header, mobile nav, footer, main layout, landing page, dashboard, loading/error/404 pages, theme toggle, and skeleton components. The testing infrastructure is fully configured from Phase 3 (Vitest, Testing Library, MSW, test factories). Existing auth tests pass and provide patterns to follow.

- **What exists**:
  - `vitest.config.ts` — Configured with React plugin, jsdom environment, path aliases, setup file
  - `src/test/setup.ts` — Global test setup with jest-dom matchers, MSW server lifecycle, cleanup
  - `src/mocks/handlers.ts` — MSW handlers for auth endpoints (`/api/auth/username` GET and POST)
  - `src/test/factories.ts` — Test data factory functions
  - Existing test files (5 files, all passing):
    - `src/app/(auth)/login/__tests__/page.test.tsx`
    - `src/app/(auth)/onboarding/__tests__/page.test.tsx`
    - `src/app/api/auth/username/__tests__/route.test.ts`
    - `src/lib/validations/__tests__/auth.test.ts`
    - `src/lib/__tests__/auth-utils.test.ts`
  - `src/components/layout/header.tsx` — Header component (task 4.1)
  - `src/components/layout/mobile-nav.tsx` — Mobile nav component (task 4.1)
  - `src/components/layout/footer.tsx` — Footer component (task 4.2)
  - `src/components/layout/theme-toggle.tsx` — Theme toggle component (task 4.4)
  - `src/app/page.tsx` — Landing page (task 4.3)
  - `src/app/(main)/dashboard/page.tsx` — Dashboard page (task 4.3)
  - `src/app/loading.tsx` — Global loading page (task 4.4)
  - `src/app/error.tsx` — Global error boundary (task 4.4)
  - `src/app/not-found.tsx` — Custom 404 page (task 4.4)
- **What is missing**:
  - Test files for all Phase 4 components and pages
- **Relevant code**:
  - `docs/ROADMAP.md` lines 354-362 — Task 4.5 full requirements
  - Existing test files for patterns and conventions
  - `vitest.config.ts` — Test file pattern: `src/**/__tests__/**/*.test.{ts,tsx}`

---

## Desired Outcome

- **End state**: Comprehensive test coverage for all Phase 4 components and pages. Tests verify rendering, interactivity, auth state handling, responsive behavior indicators, dark mode toggling, navigation links, and error/loading states. All tests pass alongside existing Phase 3 tests.
- **User-facing changes**: None (tests are developer-facing infrastructure)
- **Developer-facing changes**:
  - `src/components/layout/__tests__/header.test.tsx` — Header component tests
  - `src/components/layout/__tests__/mobile-nav.test.tsx` — Mobile nav component tests
  - `src/components/layout/__tests__/footer.test.tsx` — Footer component tests
  - `src/components/layout/__tests__/theme-toggle.test.tsx` — Theme toggle component tests
  - `src/app/(main)/dashboard/__tests__/page.test.tsx` — Dashboard page tests
  - `src/app/__tests__/error.test.tsx` — Error boundary tests
  - `src/app/__tests__/not-found.test.tsx` — 404 page tests
  - Updated `src/mocks/handlers.ts` if additional mock handlers are needed
  - Updated `src/test/factories.ts` if additional factory functions are needed

---

## Scope & Boundaries

### In Scope

- Write unit/component tests for Header, Mobile Nav, Footer, Theme Toggle
- Write page tests for Dashboard, Error, Not-Found
- Test authenticated vs. unauthenticated rendering states
- Test navigation link hrefs are correct
- Test mobile nav open/close behavior
- Test dark mode toggle functionality
- Test error boundary "Try Again" button
- Test 404 page navigation links
- Mock NextAuth session for auth state testing
- Follow existing test patterns from Phase 3 tests

### Out of Scope

- Testing the landing page redirect logic (server component `auth()` + `redirect()` is difficult to unit test — better suited for E2E tests in Phase 11)
- E2E tests (Phase 11)
- Testing responsive CSS breakpoints (CSS behavior, not testable via jsdom)
- Testing actual page transitions/loading states (requires browser environment)
- Modifying any non-test files (all components should already be complete)

### Dependencies

- Tasks 4.1-4.4 — All Phase 4 components and pages must be complete
- Vitest, Testing Library, MSW configured (Phase 3 task 3.6)
- Existing test patterns from Phase 3

---

## Implementation Details

### Section 1: Header Component Tests

**What to do**: Create `src/components/layout/__tests__/header.test.tsx`.

**Where to find context**:

- `src/components/layout/header.tsx` — Component to test
- `src/app/(auth)/login/__tests__/page.test.tsx` — Example of testing with mocked session
- `docs/ROADMAP.md` lines 355-356 — Header test requirements

**Specific requirements**:

- Test header renders app logo/name
- Test navigation links render with correct `href` attributes (My Recipes → `/my-recipes`, Community → `/community`, Shopping Lists → `/shopping-lists`)
- Test "Add Recipe" button renders with correct href (`/recipes/new`)
- Test authenticated state: user avatar and dropdown appear
- Test unauthenticated state: "Sign In" button appears instead of avatar
- Test dropdown menu items render when avatar is clicked (My Collection, Settings, Sign Out)
- Test "Sign Out" action triggers `signOut()` from NextAuth
- Mock `useSession()` from `next-auth/react` to control auth state
- Mock `signOut` from `next-auth/react`

**Patterns to follow**:

- Existing Phase 3 test patterns for mocking NextAuth session
- `@testing-library/react` render + query patterns
- `@testing-library/user-event` for click interactions

---

### Section 2: Mobile Navigation Tests

**What to do**: Create `src/components/layout/__tests__/mobile-nav.test.tsx`.

**Where to find context**:

- `src/components/layout/mobile-nav.tsx` — Component to test
- `docs/ROADMAP.md` lines 357 — Mobile nav test requirements

**Specific requirements**:

- Test mobile nav renders all navigation links with correct hrefs
- Test authenticated state: user info section appears
- Test unauthenticated state: Sign In button appears
- Test navigation links have correct targets
- Mock the Sheet's open/close state as needed
- Test "Sign Out" button triggers signOut action

**Patterns to follow**:

- Same NextAuth mocking pattern as header tests
- Testing Library query patterns for elements within a Sheet/dialog

---

### Section 3: Footer Component Tests

**What to do**: Create `src/components/layout/__tests__/footer.test.tsx`.

**Where to find context**:

- `src/components/layout/footer.tsx` — Component to test

**Specific requirements**:

- Test footer renders copyright text
- Test footer renders navigation links (About, Privacy, Terms)
- Test footer renders attribution text
- Simple rendering tests — no interaction testing needed

**Patterns to follow**:

- Simple component rendering test pattern

---

### Section 4: Theme Toggle Tests

**What to do**: Create `src/components/layout/__tests__/theme-toggle.test.tsx`.

**Where to find context**:

- `src/components/layout/theme-toggle.tsx` — Component to test
- `docs/ROADMAP.md` lines 358 — Dark mode toggle test

**Specific requirements**:

- Mock `useTheme()` from `next-themes` to return controlled theme state
- Test toggle renders a button with appropriate aria-label
- Test clicking the toggle calls `setTheme()` with the expected value
- Test different theme states show appropriate icons (sun/moon)
- Handle the hydration guard: the component may not render icons until mounted — account for this in tests by advancing timers or using `waitFor`

**Patterns to follow**:

- Mock `next-themes` module: `vi.mock('next-themes', () => ({ useTheme: vi.fn() }))`
- Testing Library `waitFor` for async state updates

---

### Section 5: Dashboard Page Tests

**What to do**: Create `src/app/(main)/dashboard/__tests__/page.test.tsx`.

**Where to find context**:

- `src/app/(main)/dashboard/page.tsx` — Page to test
- `docs/ROADMAP.md` lines 360 — Dashboard test requirements

**Specific requirements**:

- Note: The dashboard is a server component. Testing server components directly with Testing Library requires specific patterns.
- If the dashboard is a server component using `auth()`:
  - Mock the `auth` function from `@/lib/auth`
  - Call the component as an async function and render its result
  - Or convert specific interactive sections to client components that can be tested independently
- Test welcome message renders with user's name
- Test quick stats cards render (even with placeholder values)
- Test quick action buttons render with correct hrefs
- Test empty state for recent recipes section
- If direct server component testing proves too complex, focus on testing the interactive client sub-components extracted from the dashboard

**Patterns to follow**:

- Server component testing pattern: `const result = await DashboardPage(); render(result);`
- Or extract testable client components and test those individually

---

### Section 6: Error Boundary Tests

**What to do**: Create `src/app/__tests__/error.test.tsx`.

**Where to find context**:

- `src/app/error.tsx` — Error boundary to test

**Specific requirements**:

- Test error page renders "Something went wrong" heading
- Test "Try Again" button renders and calls `reset()` when clicked
- Test "Go Home" link renders with correct href
- Test that the actual error message is NOT displayed to the user
- Pass mock `error` and `reset` props to the component

**Patterns to follow**:

- Render with props: `render(<ErrorPage error={new Error('test')} reset={mockReset} />)`

---

### Section 7: Not Found Page Tests

**What to do**: Create `src/app/__tests__/not-found.test.tsx`.

**Where to find context**:

- `src/app/not-found.tsx` — 404 page to test

**Specific requirements**:

- Test page renders "404" text
- Test page renders "Page not found" message
- Test navigation links render with correct hrefs (dashboard, community, home)

**Patterns to follow**:

- Simple component rendering test pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] All new tests pass (`npm run test:run`)
- [ ] All existing Phase 3 tests still pass
- [ ] No test warnings or console errors during test runs

### Functional Verification

- [ ] Header tests cover authenticated and unauthenticated states
- [ ] Header tests verify all navigation link hrefs
- [ ] Header tests verify dropdown menu interactions
- [ ] Mobile nav tests verify navigation links and auth states
- [ ] Footer tests verify rendering of copyright and links
- [ ] Theme toggle tests verify theme switching behavior
- [ ] Dashboard tests verify welcome message, stats, and quick actions
- [ ] Error boundary tests verify "Try Again" calls reset
- [ ] 404 page tests verify navigation links
- [ ] All tests use proper mocking (no real API calls, no real auth)

### Code Quality Checks

- [ ] New tests follow patterns established by Phase 3 tests
- [ ] Tests are organized in `__tests__/` directories adjacent to their components
- [ ] Test file naming follows convention: `<component>.test.tsx`
- [ ] Tests use descriptive `describe` and `it` blocks
- [ ] No flaky tests (no timing-dependent assertions without proper `waitFor`)
- [ ] Mocks are properly scoped and cleaned up

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope (only test files and mock updates)
- [ ] No features from future tasks were partially implemented
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- The default export name `Error` in `src/app/error.tsx` shadows the global `Error` constructor. Tests must import it with a different alias (e.g., `ErrorPage`) to avoid `new Error()` calls being misinterpreted.
- Radix UI Sheet/DropdownMenu portals render correctly in jsdom but produce a benign jsdom warning: "Not implemented: navigation to another Document" when links are clicked.
- The `useSyncExternalStore` hydration guard in `theme-toggle.tsx` correctly returns the client snapshot (`true`) in jsdom, so the mounted state renders without special handling.
- The `getUserInitials` function in both `header.tsx` and `mobile-nav.tsx` is duplicated — could be extracted to a shared utility in a future refactoring task.

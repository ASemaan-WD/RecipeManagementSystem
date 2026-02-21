---
task_id: 'task-11.2'
title: 'E2E Tests & Edge Cases'
phase: 11
task_number: 2
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-11.1'
blocks:
  - 'task-12.3'
created_at: '2026-02-22'
---

# E2E Tests & Edge Cases

## Current State

> Playwright is installed and configured (from Task 11.1) with a `playwright.config.ts` pointing to the `e2e/` directory, but no E2E tests exist yet. The application has all features implemented through Phase 10. All unit and integration tests pass. The MSW handler set is comprehensive, and mock factories cover all models.

- **What exists**:
  - Playwright installed with Chromium browser (from Task 11.1)
  - `playwright.config.ts` at project root with `testDir: './e2e'`, `baseURL: 'http://localhost:3000'`, web server configuration
  - Empty `e2e/` directory
  - `test:e2e` script in `package.json`
  - Complete application with all features from Phases 1-10
  - Comprehensive unit/integration test suite (37+ test files)
  - MSW handlers for all API endpoints
  - Mock factories for all model types
  - Prisma seed data with test users and recipes (`prisma/seed.ts`)
- **What is missing**:
  - E2E test files for critical user journeys
  - Edge case tests for concurrent operations, maximum data, and security
  - Playwright test utilities (auth helpers, page objects)
  - E2E test seed data configuration
- **Relevant code**:
  - `playwright.config.ts` — Playwright configuration
  - `e2e/` — empty E2E test directory
  - `prisma/seed.ts` — seed data (test users, recipes, etc.)
  - `src/app/` — all pages and routes to test
  - `middleware.ts` — auth middleware (redirects for protected routes)

---

## Desired Outcome

- **End state**: Comprehensive E2E test suite covering 7 critical user journeys and 10+ edge case scenarios. Tests run against the development server with seeded test data. Tests verify end-to-end behavior from user interaction to API response to UI update.
- **User-facing changes**: None — this is a testing task.
- **Developer-facing changes**:
  - New file: `e2e/helpers/auth.ts` — authentication helpers for E2E tests (login flow, session management)
  - New file: `e2e/helpers/test-data.ts` — test data constants and helpers
  - New files: 7 E2E journey test files in `e2e/`
  - New file: `e2e/edge-cases.spec.ts` — edge case tests
  - Modified: `playwright.config.ts` — any adjustments needed after writing tests

---

## Scope & Boundaries

### In Scope

- E2E test helpers for authentication (OAuth mock or test user login)
- 7 critical user journey E2E tests
- Edge case tests for concurrent operations, max data, input sanitization, rate limiting, malformed requests, expired resources, database constraints
- Test data helpers and constants

### Out of Scope

- Fixing bugs discovered during E2E testing (document as notes, fix separately)
- Performance testing (Task 12.2)
- Security penetration testing (Task 12.3 — edge case tests here focus on input validation, not exhaustive security testing)
- Cross-browser testing (Chrome only in Phase 11; expand in Phase 13)
- Mobile device testing (viewport testing only, not real device testing)
- CI/CD pipeline integration

### Dependencies

- Task 11.1 (Testing Infrastructure) — **must be complete** so Playwright is configured, MSW handlers are comprehensive, and factories are available

---

## Implementation Details

### Section 1: E2E Test Utilities & Auth Helpers

**What to do**: Create helper utilities for E2E tests, specifically for handling authentication.

**Where to find context**:

- `playwright.config.ts` — Playwright configuration
- `middleware.ts` — auth middleware behavior (redirects unauthenticated to `/login`)
- `src/lib/auth.ts` — NextAuth configuration (Google and GitHub OAuth)

**Specific requirements**:

**`e2e/helpers/auth.ts`**:

- Since the app uses OAuth (Google/GitHub), E2E tests cannot easily log in via the real OAuth flow
- Strategy: Use Playwright's `storageState` to persist authentication. Create an auth setup that either:
  1. **Option A — Direct database seeding**: Before tests, seed a test user with a known session in the database and set the session cookie directly via Playwright's `page.context().addCookies()`
  2. **Option B — NextAuth credentials provider (test only)**: If a test-only credentials provider exists, use it for login. (Check if one exists; if not, note this as a limitation)
- Provide a `loginAsTestUser(page)` helper that authenticates the test browser
- Provide a `logout(page)` helper
- Create a Playwright `global-setup.ts` if needed for one-time auth state generation

**`e2e/helpers/test-data.ts`**:

- Constants for test user data (matching seed data): `TEST_USER_ID`, `TEST_USER_NAME`, `TEST_USER_EMAIL`, `TEST_USER_USERNAME`
- Constants for test recipe IDs, names, etc.
- Helper functions for common assertions

**Patterns to follow**:

- Playwright best practices: use `page.goto()`, `page.locator()`, `page.getByRole()`, `page.getByText()`, `expect()`
- Prefer accessible selectors (`getByRole`, `getByLabel`, `getByText`) over CSS selectors

---

### Section 2: E2E Journey — Recipe Creation Happy Path

**What to do**: Create `e2e/recipe-creation.spec.ts` testing the full recipe creation flow.

**Where to find context**:

- `src/app/(main)/recipes/new/page.tsx` — recipe creation page
- `src/components/recipes/recipe-form/recipe-form-wizard.tsx` — multi-step form wizard

**Specific requirements**:

- Test flow: Login → Navigate to "Add Recipe" → Complete 5-step form wizard → Submit → Verify redirect to new recipe detail page → Verify recipe data displayed correctly
- Step 1 (Basic Info): Fill title, description, prep time, cook time, servings, difficulty, cuisine, visibility
- Step 2 (Ingredients): Add 2-3 ingredients with name and quantity
- Step 3 (Instructions): Add 2-3 steps with instructions and optional durations
- Step 4 (Tags): Select dietary tags
- Step 5 (Images): Skip or add a URL image
- Verify: Recipe detail page shows all entered data correctly
- Cleanup: Delete the created recipe after test (or use test isolation)

---

### Section 3: E2E Journey — Search Flow

**What to do**: Create `e2e/search-flow.spec.ts` testing the search and filter experience.

**Where to find context**:

- `src/app/(main)/search/page.tsx` — search results page
- `src/components/search/search-bar.tsx` — search bar component
- `src/components/search/filter-panel.tsx` — filter panel

**Specific requirements**:

- Test flow: Login → Type search query in header search bar → Press Enter → Verify search results page loads → Apply filters (cuisine, difficulty) → Verify results update → Sort results → Click a recipe card → Verify navigation to recipe detail
- Verify URL updates with search parameters (shareable URLs)
- Verify empty state when search yields no results
- Verify filter clear resets results

---

### Section 4: E2E Journey — Social Flow

**What to do**: Create `e2e/social-flow.spec.ts` testing the rating and commenting experience.

**Where to find context**:

- `src/components/social/star-rating.tsx` — rating widget
- `src/components/social/comment-section.tsx` — comment section
- `src/app/(main)/recipes/[id]/page.tsx` — recipe detail page

**Specific requirements**:

- Test flow: Login → Navigate to a public recipe (not owned by test user) → Rate the recipe (click 4 stars) → Verify rating updates → Add a comment → Verify comment appears → Edit the comment → Verify edit shows → Delete the comment → Verify removal
- Verify: Cannot rate own recipe (if test data includes an owned recipe)
- Verify: Rating average updates after rating

---

### Section 5: E2E Journey — Sharing Flow

**What to do**: Create `e2e/sharing-flow.spec.ts` testing recipe sharing.

**Where to find context**:

- `src/components/social/share-dialog.tsx` — share dialog
- `src/app/api/recipes/[id]/shares/route.ts` — share API
- `src/app/api/recipes/[id]/share-link/route.ts` — share link API

**Specific requirements**:

- Test flow: Login → Navigate to an owned recipe → Open share dialog → Change visibility to SHARED → Share with a username → Verify user appears in shared list → Generate share link → Copy link → Verify link URL format → Revoke share → Verify user removed from list
- Test share link access: Navigate to share link URL → Verify recipe is accessible
- Test revoked link: After revoking share link → Navigate to link → Verify access denied

---

### Section 6: E2E Journey — Collection Flow

**What to do**: Create `e2e/collection-flow.spec.ts` testing the tagging and collection experience.

**Where to find context**:

- `src/components/recipes/tag-toggles.tsx` — tag toggle buttons
- `src/components/recipes/save-button.tsx` — save button
- `src/app/(main)/my-collection/page.tsx` — collection page

**Specific requirements**:

- Test flow: Login → Navigate to a recipe → Tag as Favorite → Tag as To Try → Save recipe → Navigate to My Collection → Verify "All" tab shows the recipe → Switch to "Favorites" tab → Verify recipe present → Switch to "To Try" tab → Verify recipe present → Switch to "Saved" tab → Verify recipe present → Remove Favorite tag → Verify removal from Favorites tab

---

### Section 7: E2E Journey — AI Generation Flow

**What to do**: Create `e2e/ai-generation.spec.ts` testing the AI recipe generator.

**Where to find context**:

- `src/app/(main)/ai/generate/page.tsx` — AI generation page
- `src/components/ai/recipe-generator.tsx` — recipe generator component

**Specific requirements**:

- Test flow: Login → Navigate to AI Generate page → Enter ingredients (e.g., "chicken, rice, garlic") → Select preferences (cuisine, difficulty) → Click "Generate Recipe" → Wait for streaming response → Verify recipe content appears → Click "Save as New Recipe" → Verify redirect to recipe form or detail page
- Note: This test depends on OpenAI API availability. Consider:
  - If in a CI environment, mock the AI response at the network level
  - If running locally, allow real API calls but with timeout handling

---

### Section 8: E2E Journey — Guest Access Flow

**What to do**: Create `e2e/guest-access.spec.ts` testing unauthenticated user behavior.

**Where to find context**:

- `src/app/community/page.tsx` or `src/app/(main)/community/page.tsx` — public community page
- `middleware.ts` — route protection
- `src/app/(main)/recipes/[id]/page.tsx` — recipe detail with guest restrictions

**Specific requirements**:

- Test flow (no login): Navigate to community page → Verify public recipes displayed as summary cards → Click a recipe → Verify summary view with login CTA → Verify ingredients/steps are blurred or hidden → Click login CTA → Verify redirect to login page
- Test protected routes: Navigate to `/dashboard` → Verify redirect to `/login`
- Test protected routes: Navigate to `/my-recipes` → Verify redirect to `/login`
- Verify: Guest can access public recipe detail via direct URL but with limited view

---

### Section 9: Edge Case Tests

**What to do**: Create `e2e/edge-cases.spec.ts` with tests for boundary conditions and error scenarios.

**Where to find context**:

- `docs/ROADMAP.md` lines 914-916 — edge case requirements
- All API routes — for input validation testing

**Specific requirements**:

**Maximum Data Tests**:

- Create a recipe with the maximum allowed title length (200 chars) — verify it saves and displays
- Create a recipe with many ingredients (20+) — verify form handles it
- Create a recipe with many steps (15+) — verify form handles it
- Submit a long comment (close to 1000 char limit) — verify it saves

**Input Sanitization Tests**:

- Enter HTML/script tags in recipe title — verify they are escaped/sanitized in display
- Enter HTML/script tags in comment — verify sanitization
- Enter special characters in search query — verify no errors
- Enter SQL-like patterns in search — verify no errors

**Error Handling Tests**:

- Navigate to a non-existent recipe ID — verify 404 page
- Navigate to a recipe the user doesn't have access to — verify access denied
- Submit a form with missing required fields — verify validation errors displayed
- Test network error handling: disconnect and attempt an action — verify error toast

**Rate Limiting Tests** (if testable):

- Rapidly call an AI endpoint — verify 429 response is handled gracefully in UI

**Expired/Deleted Resource Tests**:

- Access a share link for a deleted recipe — verify appropriate error message
- Access a revoked share link — verify access denied

**Patterns to follow**:

- Group related edge cases in `test.describe()` blocks
- Use `test.slow()` for tests that need extended timeouts
- Clean up test data after each test

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] All unit/integration tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)

### Functional Verification

- [ ] Recipe creation journey E2E test passes end-to-end
- [ ] Search flow E2E test passes (search, filter, sort, click result)
- [ ] Social flow E2E test passes (rate, comment, edit, delete)
- [ ] Sharing flow E2E test passes (share by username, share link, revoke)
- [ ] Collection flow E2E test passes (tag, save, collection tabs)
- [ ] AI generation flow E2E test passes (generate, view stream, save)
- [ ] Guest access flow E2E test passes (summary view, login CTA, redirects)
- [ ] Maximum data edge cases pass (long titles, many ingredients/steps)
- [ ] Input sanitization edge cases pass (HTML/XSS, special chars, SQL patterns)
- [ ] Error handling edge cases pass (404, access denied, validation errors)
- [ ] E2E tests use accessible selectors (`getByRole`, `getByLabel`, `getByText`)
- [ ] Tests clean up after themselves (no test data pollution)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] E2E tests are organized by user journey in separate files
- [ ] Test helpers are reusable across test files
- [ ] Tests have descriptive names that explain the user behavior being tested

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

---
task_id: 'task-3.6'
title: 'Write Tests for Authentication'
phase: 3
task_number: 6
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-3.1'
  - 'task-3.2'
  - 'task-3.3'
  - 'task-3.4'
  - 'task-3.5'
blocks: []
created_at: '2026-02-19'
---

# Write Tests for Authentication

## Current State

> Tasks 3.1-3.5 have implemented the complete authentication system: NextAuth v5 configuration, route middleware, login page, username onboarding flow, and root providers. No testing infrastructure or tests exist yet for these auth features.

- **What exists**:
  - `src/lib/auth.ts` — NextAuth v5 configuration (task 3.1)
  - `src/app/api/auth/[...nextauth]/route.ts` — Auth route handlers (task 3.1)
  - `middleware.ts` — Route protection middleware (task 3.2)
  - `src/lib/auth-utils.ts` — `getCurrentUser()`, `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()` (task 3.2)
  - `src/app/(auth)/login/page.tsx` — Login page (task 3.3)
  - `src/app/(auth)/onboarding/page.tsx` — Onboarding page (task 3.4)
  - `src/app/api/auth/username/route.ts` — Username API route (task 3.4)
  - `src/lib/validations/auth.ts` — Username Zod schema (task 3.4)
  - `src/providers/` — Auth, Query, Theme providers (task 3.5)
  - `src/app/layout.tsx` — Updated root layout with providers (task 3.5)
  - No test runner or testing libraries installed
- **What is missing**:
  - Testing infrastructure (vitest, testing-library, MSW)
  - Test files for all Phase 3 auth features
- **Relevant code**:
  - `docs/ROADMAP.md` lines 278-287 — Task 3.6 test requirements
  - `docs/ROADMAP.md` lines 1228-1253 — Phase 11 testing infrastructure details (vitest, MSW, etc.)
  - `docs/SENIOR_DEVELOPER.md` lines 1013-1025 — Username validation rules to test against

---

## Desired Outcome

- **End state**: Testing infrastructure is set up (vitest, testing-library, MSW). Unit tests cover username validation schema, auth helper utilities, and middleware logic. Integration tests cover the username API route. Component tests cover the login and onboarding pages. All tests pass.
- **User-facing changes**: None
- **Developer-facing changes**:
  - `vitest.config.ts` — Vitest configuration
  - Test setup files for testing-library matchers
  - MSW handler stubs for auth-related mocking
  - Test files for:
    - `src/lib/validations/auth.test.ts` — Username schema tests
    - `src/lib/auth-utils.test.ts` — Auth helper tests
    - `src/app/api/auth/username/route.test.ts` — Username API route tests
    - `src/app/(auth)/login/page.test.tsx` — Login page component tests
    - `src/app/(auth)/onboarding/page.test.tsx` — Onboarding page component tests

---

## Scope & Boundaries

### In Scope

- Install testing dependencies (vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw)
- Configure vitest with path aliases, setup files, and coverage
- Add test scripts to package.json
- Write unit tests for `usernameSchema` (all validation rules)
- Write unit tests for auth helper utilities (`requireAuth`, `requireRecipeOwner`, `canViewRecipe`)
- Write integration tests for username API route (GET availability, POST set username)
- Write component tests for login page (renders correctly, error states)
- Write component tests for onboarding page (form validation, availability check, submit flow)
- Create mock data factories for User and Session objects

### Out of Scope

- End-to-end tests with Playwright (Phase 11 — task 11.7)
- Full MSW handler setup for all endpoints (Phase 11 — task 11.1, only create auth-related handlers here)
- Coverage thresholds configuration (Phase 11 — task 11.8)
- Testing OAuth callback handling (requires actual OAuth flow, not practical in unit tests)
- Testing middleware redirect behavior in isolation (middleware testing with Next.js is complex; verify through integration)

### Dependencies

- Tasks 3.1-3.5 — All Phase 3 auth features must be implemented
- Testing libraries must be installed (part of this task)

---

## Implementation Details

### Section 1: Set Up Testing Infrastructure

**What to do**: Install testing dependencies and configure vitest.

**Where to find context**:

- `docs/ROADMAP.md` lines 1228-1253 — Testing infrastructure details
- Current `package.json` — No test dependencies or scripts yet
- Current `tsconfig.json` — Path aliases: `@/*` → `src/*`

**Specific requirements**:

- Install dev dependencies:
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `@vitejs/plugin-react` (for JSX support in vitest)
  - `msw` (Mock Service Worker for API mocking)
  - `jsdom` (DOM environment for component tests)
- Create `vitest.config.ts`:
  - Set `test.environment` to `jsdom`
  - Configure path aliases to match `tsconfig.json` (`@` → `./src`)
  - Set up setup files for testing-library matchers
  - Enable globals (optional, for `describe`/`it`/`expect` without imports)
- Create `src/test/setup.ts`:
  - Import `@testing-library/jest-dom` for custom matchers (toBeInTheDocument, etc.)
  - Set up MSW server for API mocking (start before all, reset after each, close after all)
- Add test scripts to `package.json`:
  - `"test": "vitest"`
  - `"test:run": "vitest run"`
  - `"test:coverage": "vitest run --coverage"`

**Patterns to follow**:

- `docs/ROADMAP.md` lines 1237-1246 — Vitest config and scripts

---

### Section 2: Create Mock Data Factories

**What to do**: Create reusable mock data factories for tests.

**Where to find context**:

- `prisma/schema.prisma` — User model fields (lines 38-58)
- `src/lib/auth.ts` — Session shape (task 3.1 type augmentation)

**Specific requirements**:

- Create `src/test/factories.ts` (or `src/mocks/factories.ts`):
  - `createMockUser(overrides?)` — returns a User object with sensible defaults
  - `createMockSession(overrides?)` — returns a NextAuth Session object with user.id and user.username
- Create `src/mocks/handlers.ts`:
  - Auth-related MSW handlers for username availability and setting
  - Mock `GET /api/auth/username` and `POST /api/auth/username`

**Patterns to follow**:

- Factory pattern: default values that can be overridden per test

---

### Section 3: Write Username Validation Tests

**What to do**: Write unit tests for `usernameSchema` in `src/lib/validations/auth.ts`.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` lines 1013-1025 — Username rules
- `docs/ROADMAP.md` line 281 — "Test username validation (regex, length, uniqueness)"

**Specific requirements**:

- Create `src/lib/validations/__tests__/auth.test.ts` (or `auth.test.ts` alongside the source):
  - Test minimum length (reject 2 chars, accept 3 chars)
  - Test maximum length (accept 20 chars, reject 21 chars)
  - Test valid characters: letters, numbers, underscores accepted
  - Test invalid characters: hyphens, spaces, special characters rejected
  - Test case sensitivity: `JohnDoe` and `johndoe` are both valid (different usernames)
  - Test edge cases: empty string, single character, exact boundary lengths

---

### Section 4: Write Auth Helper Utility Tests

**What to do**: Write unit tests for `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()` in `src/lib/auth-utils.ts`.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` lines 928-948 — Auth helper patterns
- `docs/ROADMAP.md` lines 283-286 — Auth helper test requirements

**Specific requirements**:

- Create `src/lib/__tests__/auth-utils.test.ts`:
  - Mock `auth()` from `@/lib/auth` to return various session states
  - Mock `prisma` from `@/lib/db` to return various recipe/share states

**Tests for `requireAuth()`**:

- Returns session when authenticated
- Returns/throws 401 when not authenticated (no session)

**Tests for `requireRecipeOwner(recipeId)`**:

- Returns recipe + session when user is the owner
- Returns/throws 401 when not authenticated
- Returns/throws 404 when recipe not found
- Returns/throws 403 when user is not the owner

**Tests for `canViewRecipe(recipeId, shareToken?)`**:

- Allows access when user is the recipe author
- Allows access when recipe visibility is PUBLIC
- Allows access when user has a RecipeShare record
- Allows access when a valid, active ShareLink token is provided
- Denies access (404) when none of the above apply
- Handles unauthenticated user viewing a public recipe
- Denies access for unauthenticated user on a private recipe

---

### Section 5: Write Username API Route Tests

**What to do**: Write integration-style tests for `src/app/api/auth/username/route.ts`.

**Where to find context**:

- `docs/ROADMAP.md` lines 282 — "Test username availability check endpoint"
- Task 3.4 implementation details — GET and POST handler specifications

**Specific requirements**:

- Create `src/app/api/auth/username/__tests__/route.test.ts`:
  - Mock `prisma` and `auth()` for controlled testing

**Tests for `GET /api/auth/username`**:

- Returns `{ available: true }` for an unused username
- Returns `{ available: false }` for a taken username
- Returns 400 for invalid username (too short, invalid characters)

**Tests for `POST /api/auth/username`**:

- Returns 401 for unauthenticated requests
- Sets username successfully and returns 200
- Returns 400 if user already has a username set
- Returns 409 if username is already taken
- Returns 400 for invalid username format

---

### Section 6: Write Login Page Component Tests

**What to do**: Write component tests for `src/app/(auth)/login/page.tsx`.

**Where to find context**:

- `docs/ROADMAP.md` line 280 — "Test OAuth callback handling"
- Task 3.3 implementation details

**Specific requirements**:

- Create `src/app/(auth)/login/__tests__/page.test.tsx`:
  - Test that login page renders app name/tagline
  - Test that "Sign in with Google" button is present
  - Test that "Sign in with GitHub" button is present
  - Test that error message displays when `?error=OAuthAccountNotLinked` is in URL
  - Test that default error message displays for unknown errors
  - Test that no error message shows when no error param present

---

### Section 7: Write Onboarding Page Component Tests

**What to do**: Write component tests for `src/app/(auth)/onboarding/page.tsx`.

**Where to find context**:

- Task 3.4 implementation details
- `docs/ROADMAP.md` line 281 — Username validation tests

**Specific requirements**:

- Create `src/app/(auth)/onboarding/__tests__/page.test.tsx`:
  - Test that onboarding page renders username input and "Continue" button
  - Test that "Continue" button is disabled initially
  - Test that validation errors show for invalid usernames (too short, invalid characters)
  - Test that availability check fires after typing a valid username (with debounce)
  - Test that "Continue" button enables when username is valid and available
  - Test successful form submission calls POST `/api/auth/username`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] `npm run test:run` passes all tests

### Functional Verification

- [ ] Vitest is configured and runs successfully
- [ ] Testing-library matchers work (toBeInTheDocument, etc.)
- [ ] MSW intercepts API calls in tests
- [ ] All username validation tests pass (minimum 6 test cases)
- [ ] All auth helper tests pass (minimum 9 test cases covering requireAuth, requireRecipeOwner, canViewRecipe)
- [ ] All username API route tests pass (minimum 7 test cases)
- [ ] All login page component tests pass (minimum 4 test cases)
- [ ] All onboarding page component tests pass (minimum 5 test cases)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] Test files are co-located with source or in a consistent `__tests__/` directory
- [ ] Mock factories produce realistic, typed data
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Tests are deterministic (no flaky tests due to timing or randomness)

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

- Vitest v4 requires `vi.hoisted()` for class definitions used inside `vi.mock()` factory functions (hoisting prevents referencing top-level variables).
- Zod v4 (4.3.6) maintains backward-compatible `error.issues[0]?.message` API, so existing error access patterns work.
- The `act()` wrapper from testing-library is needed around `vi.advanceTimersByTimeAsync()` calls to suppress React state update warnings when testing components with fake timers and async effects.
- Pre-existing build warnings exist for Prisma generated client using Node.js modules (`node:path`, `node:url`, `node:buffer`) in Edge Runtime traces — not introduced by this task.

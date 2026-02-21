---
task_id: 'task-11.1'
title: 'Testing Infrastructure & Mock Setup'
phase: 11
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-10.1'
  - 'task-10.2'
  - 'task-10.3'
blocks:
  - 'task-11.2'
  - 'task-12.3'
created_at: '2026-02-22'
---

# Testing Infrastructure & Mock Setup

## Current State

> The project has a working Vitest + Testing Library + MSW setup with 37 test files covering Phases 1-9 features. However, the MSW handler set is incomplete (only covers auth and recipe CRUD), the test factories are missing several model types, coverage thresholds are not configured, coverage reporting is not set up, Playwright is not installed or configured, and there are potential test gaps from Phase 10 features.

- **What exists**:
  - Vitest configuration at `vitest.config.ts` with jsdom environment, path aliases (`@/` → `src/`), setup file, and test pattern
  - Test setup at `src/test/setup.ts` with `@testing-library/jest-dom/vitest`, MSW server lifecycle hooks (`beforeAll`/`afterEach`/`afterAll`)
  - MSW handlers at `src/mocks/handlers.ts` with handlers for: auth username (GET/POST), recipes (GET/POST/PUT/DELETE, duplicate), images (DELETE, upload-signature) — **missing**: search, collections, tags, save, shares, share-links, visibility, comments, ratings, AI endpoints, shopping lists, users search
  - Test factories at `src/test/factories.ts` with factories for: `MockUser`, `Session`, `Recipe`, `RecipeListItem`, `RecipeIngredient`, `RecipeStep`, `RecipeDetail`, `UserRecipeTag`, `SavedRecipe`, `RecipeShare`, `ShareLink`, `Rating`, `Comment`, `PaginatedResponse` — **missing**: `ShoppingList`, `ShoppingListItem`, `DietaryTag`, `SearchResult`
  - 37 existing test files across API routes (32), pages (5), components (4), hooks (2), utilities (3), validations (3)
  - Test scripts in `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`
  - Dependencies installed: `vitest@4.0.18`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `msw@2.12.10`
- **What is missing**:
  - Coverage provider (e.g., `@vitest/coverage-v8` or `@vitest/coverage-istanbul`) — not installed
  - Coverage thresholds configuration in `vitest.config.ts`
  - Comprehensive MSW handlers for all API endpoints (many missing)
  - Mock factories for `ShoppingList` and `ShoppingListItem`
  - Playwright E2E testing framework (not installed or configured)
  - `test:ui` and `test:e2e` scripts in `package.json`
  - Test coverage gap audit for Phase 10 features
  - Consolidated mock data generators for all Prisma models
- **Relevant code**:
  - `vitest.config.ts` — Vitest configuration
  - `src/test/setup.ts` — test setup with MSW
  - `src/test/factories.ts` — mock data factories
  - `src/mocks/handlers.ts` — MSW request handlers
  - `package.json` (lines 18-20) — test scripts

---

## Desired Outcome

- **End state**: The testing infrastructure is complete with coverage reporting configured with thresholds, all MSW handlers covering every API endpoint, mock factories for all models, Playwright installed and configured for E2E tests, and any test coverage gaps from Phases 6-10 are backfilled.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**:
  - Modified: `vitest.config.ts` — coverage provider and thresholds added
  - Modified: `package.json` — new scripts (`test:ui`, `test:e2e`), new dev dependencies (`@vitest/coverage-v8`, `@playwright/test`)
  - Modified: `src/mocks/handlers.ts` — comprehensive MSW handlers for all endpoints
  - Modified: `src/test/factories.ts` — additional mock factories (`ShoppingList`, `ShoppingListItem`, `DietaryTag`)
  - New file: `playwright.config.ts` — Playwright configuration
  - New directory: `e2e/` — E2E test directory (empty, populated in Task 11.2)
  - New backfill test files for any coverage gaps identified in audit

---

## Scope & Boundaries

### In Scope

- Install and configure `@vitest/coverage-v8` for coverage reporting
- Configure coverage thresholds in `vitest.config.ts`: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Add missing MSW handlers for all API endpoints
- Add missing mock factories for `ShoppingList`, `ShoppingListItem`, and any other gaps
- Install and configure Playwright for E2E testing
- Add test scripts: `test:ui` (Vitest UI), `test:e2e` (Playwright)
- Audit test coverage across Phases 6-10 and backfill missing tests
- Run coverage report and document current baseline

### Out of Scope

- Writing E2E tests (Task 11.2)
- Fixing existing test failures (if any, document as notes)
- Refactoring existing test implementations
- Performance testing infrastructure
- Security testing infrastructure
- CI/CD pipeline configuration

### Dependencies

- Task 10.1, 10.2, 10.3 — all Phase 10 features must be complete so the coverage audit is meaningful
- All Phase 6-9 tasks — verified complete

---

## Implementation Details

### Section 1: Install Coverage Provider

**What to do**: Install `@vitest/coverage-v8` and configure coverage thresholds.

**Where to find context**:

- `vitest.config.ts` — current Vitest configuration
- `docs/ROADMAP.md` lines 905-906 — coverage threshold requirements
- `package.json` — current dev dependencies

**Specific requirements**:

- Install: `npm install -D @vitest/coverage-v8`
- Update `vitest.config.ts` to add coverage configuration:
  ```typescript
  test: {
    // ... existing config
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/generated/**',
        'src/test/**',
        'src/mocks/**',
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/index.ts',
        'src/types/**/*.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  }
  ```
- Add `coverage/` to `.gitignore` if not already present
- Verify `npm run test:coverage` produces a report

**Patterns to follow**:

- Keep existing Vitest configuration intact, only add coverage block

---

### Section 2: Install & Configure Playwright

**What to do**: Install Playwright and create a basic configuration for E2E tests.

**Where to find context**:

- `docs/ROADMAP.md` lines 903-904 — Playwright configuration requirements

**Specific requirements**:

- Install: `npm install -D @playwright/test`
- Install browsers: `npx playwright install --with-deps chromium` (start with Chromium only to keep CI fast)
- Create `playwright.config.ts` at project root:

  ```typescript
  import { defineConfig, devices } from '@playwright/test';

  export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  });
  ```

- Create `e2e/` directory with a placeholder `e2e/.gitkeep`
- Add `test-results/`, `playwright-report/` to `.gitignore`
- Update `package.json` scripts:
  - `"test:ui": "vitest --ui"`
  - `"test:e2e": "playwright test"`

**Patterns to follow**:

- Standard Playwright configuration for Next.js projects
- Keep configuration minimal — extend in Task 11.2

---

### Section 3: Expand MSW Handlers

**What to do**: Add MSW handlers for every API endpoint not currently covered.

**Where to find context**:

- `src/mocks/handlers.ts` — current handlers (auth username, recipes CRUD, images)
- All API route files under `src/app/api/` — endpoints to mock

**Specific requirements**:
Add handlers for all missing endpoints, organized by domain:

**Search handlers**:

- `GET /api/search` — return paginated recipe results
- `GET /api/search/cuisines` — return cuisine options
- `GET /api/search/dietary-tags` — return dietary tag options

**Tag & Save handlers**:

- `POST /api/recipes/:id/tags` — add tag, return success
- `DELETE /api/recipes/:id/tags` — remove tag, return success
- `POST /api/recipes/:id/save` — save recipe, return success
- `DELETE /api/recipes/:id/save` — unsave recipe, return success

**Collection handlers**:

- `GET /api/collections` — return paginated collection

**Sharing handlers**:

- `GET /api/recipes/:id/shares` — return shared users list
- `POST /api/recipes/:id/shares` — share with user, return success
- `DELETE /api/recipes/:id/shares` — revoke share, return success
- `POST /api/recipes/:id/share-link` — generate share link
- `DELETE /api/recipes/:id/share-link` — revoke share link
- `PUT /api/recipes/:id/visibility` — update visibility
- `GET /api/share/:token` — validate share token

**Social handlers**:

- `GET /api/recipes/:id/ratings` — return rating data
- `POST /api/recipes/:id/ratings` — submit rating
- `GET /api/recipes/:id/comments` — return paginated comments
- `POST /api/recipes/:id/comments` — add comment
- `PUT /api/comments/:id` — edit comment
- `DELETE /api/comments/:id` — delete comment

**User search handlers**:

- `GET /api/users/search` — return user search results

**AI handlers**:

- `POST /api/ai/generate` — return streamed recipe generation (mock with simple response)
- `POST /api/ai/substitute` — return substitution suggestions
- `POST /api/ai/nutrition/:recipeId` — return nutrition data
- `POST /api/ai/generate-image/:recipeId` — return generated image URL

**Shopping list handlers**:

- `GET /api/shopping-lists` — return user's shopping lists
- `POST /api/shopping-lists` — create shopping list
- `GET /api/shopping-lists/:id` — return shopping list detail
- `PUT /api/shopping-lists/:id` — update list name
- `DELETE /api/shopping-lists/:id` — delete list
- `POST /api/shopping-lists/:id/items` — add item
- `PUT /api/shopping-lists/:id/items/:itemId` — update item
- `DELETE /api/shopping-lists/:id/items/:itemId` — delete item

**Shared with me handlers**:

- `GET /api/recipes/shared-with-me` — return shared recipes

Each handler should return sensible mock data using factories from `src/test/factories.ts`.

**Patterns to follow**:

- Follow the existing handler pattern in `src/mocks/handlers.ts`
- Use `http.get()`, `http.post()`, `http.put()`, `http.delete()` from `msw`
- Use factory functions to generate response data

---

### Section 4: Expand Mock Factories

**What to do**: Add missing mock factories to `src/test/factories.ts`.

**Where to find context**:

- `src/test/factories.ts` — existing factory pattern
- `prisma/schema.prisma:273-294` — ShoppingList and ShoppingListItem models

**Specific requirements**:

- Add `createMockShoppingList(overrides)`:
  ```typescript
  {
    (id, name, userId, itemCount, checkedCount, createdAt, updatedAt);
  }
  ```
- Add `createMockShoppingListItem(overrides)`:
  ```typescript
  {
    (id, shoppingListId, ingredientName, quantity, category, checked, order);
  }
  ```
- Add `createMockDietaryTag(overrides)`:
  ```typescript
  {
    (id, name);
  }
  ```
- Add `createMockShoppingListDetail(overrides)` — a list with items
- Review existing factories for completeness and consistency

**Patterns to follow**:

- Follow the existing factory pattern: `interface Mock<Model>`, `function createMock<Model>(overrides = {})` returning full object with defaults spread with overrides

---

### Section 5: Test Coverage Audit & Backfill

**What to do**: Run coverage report, identify gaps, and write missing tests for features from Phases 6-10.

**Where to find context**:

- Run `npm run test:coverage` to generate the coverage report
- Review coverage per file/directory to identify gaps

**Specific requirements**:

- Run coverage report and document baseline numbers
- Identify files/functions with coverage below thresholds
- Prioritize backfilling tests for:
  - **Phase 10.1 features**: `src/lib/scaling.ts` tests, `serving-adjuster` component tests, `cooking-timer` component tests, `cooking-mode` component tests (if not already written in Task 10.1)
  - **Phase 10.2 features**: Shopping list API route tests, `shopping-list` component tests, `add-to-list-button` component tests, `use-shopping-lists` hook tests (if not already written in Task 10.2)
  - **Phase 10.3 features**: Print view tests, accessibility tests (if not already written in Task 10.3)
  - **Any Phase 6-9 gaps**: Components or utilities with low coverage
- Each backfill test should be created in the standard co-located `__tests__/` directory

**Note**: Tasks 10.1, 10.2, and 10.3 each include their own test sections. This step specifically covers any gaps NOT addressed in those tasks. If all tests from Phase 10 tasks were written successfully, this step may require minimal work. The audit still needs to be performed to confirm.

**Patterns to follow**:

- Follow `.claude/test-file-skill.md` conventions
- Use MSW handlers from Section 3 for integration tests
- Use factories from Section 4 for mock data

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] All existing tests pass (`npm run test`)
- [ ] Coverage report generates successfully (`npm run test:coverage`)

### Functional Verification

- [ ] `@vitest/coverage-v8` installed and producing coverage reports
- [ ] Coverage thresholds configured: statements 80%, branches 75%, functions 80%, lines 80%
- [ ] HTML coverage report generated in `coverage/` directory
- [ ] Playwright installed with Chromium browser
- [ ] `playwright.config.ts` exists with correct base URL and test directory
- [ ] `e2e/` directory exists
- [ ] `npm run test:ui` opens Vitest UI
- [ ] `npm run test:e2e` runs (even if no E2E tests yet, should exit cleanly)
- [ ] MSW handlers exist for ALL API endpoints (no unhandled request warnings in tests)
- [ ] Mock factories exist for all major model types
- [ ] Coverage audit completed and gaps documented
- [ ] Any identified test gaps are backfilled
- [ ] Current test coverage baseline documented in notes

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] MSW handlers are organized by domain (matching comments in file)
- [ ] Factory functions follow consistent naming and override pattern

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented (no E2E tests written — that's Task 11.2)
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_

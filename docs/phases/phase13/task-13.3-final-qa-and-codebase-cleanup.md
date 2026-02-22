---
task_id: 'task-13.3'
title: 'Final QA & Codebase Cleanup'
phase: 13
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-13.2'
blocks:
  - 'task-13.4'
created_at: '2026-02-22'
---

# Final QA & Codebase Cleanup

## Current State

> The application is deployed to Vercel and functional. Basic smoke testing has been performed (task 13.2). Comprehensive QA testing and codebase cleanup remain.

- **What exists**:
  - Live production deployment on Vercel
  - All features implemented (Phases 1-11)
  - Performance optimizations applied (Phase 12)
  - Basic smoke testing completed (task 13.2)
  - Test suite with Vitest unit/integration tests and Playwright E2E tests
- **What is missing**:
  - Comprehensive end-to-end QA testing of every user flow on production
  - Codebase cleanup: removal of TODOs, unused imports, console.logs, debug code
  - Final lint and format pass
  - Mobile device testing on actual devices (or thorough responsive simulation)
  - Keyboard navigation and accessibility verification
- **Relevant code**:
  - All `src/` source files (for cleanup audit)
  - `e2e/` directory (Playwright E2E tests)
  - All page and component files (for QA verification)

---

## Desired Outcome

- **End state**: Every user flow has been manually verified on the production deployment. The codebase is clean — no TODOs, unused imports, console.logs, or debug artifacts. Linting and formatting are passing. The application is polished and ready for submission.
- **User-facing changes**: Any bugs or polish issues discovered during QA are fixed.
- **Developer-facing changes**: Clean codebase with no development artifacts remaining.

---

## Scope & Boundaries

### In Scope

- Comprehensive manual QA testing of every user flow on production (see full checklist below)
- Remove all `TODO`, `FIXME`, `HACK`, `XXX` comments that are no longer relevant
- Remove all `console.log`, `console.warn`, `console.error` statements that are debug artifacts (keep intentional server-side logging)
- Remove unused imports across all files
- Remove any test/debug code that leaked into production files
- Run `npm run lint` and fix all errors
- Run `npm run format` to ensure consistent formatting
- Fix any bugs discovered during QA testing (within reason — critical bugs must be fixed, cosmetic issues can be noted)
- Verify keyboard navigation works for core flows (tab through forms, enter to submit, escape to close dialogs)
- Verify basic accessibility: focus indicators visible, ARIA labels on interactive elements, form error announcements

### Out of Scope

- Writing new features or enhancements
- Full WCAG AA compliance audit (a dedicated accessibility audit is beyond launch scope)
- Performance profiling or Lighthouse scoring (task 12.2 handled performance)
- Security re-testing (task 12.3 handled security)
- Mobile device testing on physical devices (responsive browser simulation is sufficient)
- README or documentation updates (task 13.4)

### Dependencies

- Task 13.2 completed (application is deployed and accessible)

---

## Implementation Details

### Section 1: Comprehensive QA Test Checklist

**What to do**: Manually test every user flow on the production deployment.

**Where to find context**:

- `docs/ROADMAP.md` Phase 13.3: full QA checklist
- `docs/PRODUCT_MANAGER.md`: user stories and acceptance criteria

**Specific requirements** — test each flow and document pass/fail:

**Authentication & Onboarding**:

- [ ] Sign in with Google OAuth
- [ ] Sign in with GitHub OAuth
- [ ] Onboarding page appears for new users
- [ ] Username validation works (too short, invalid chars, already taken)
- [ ] Username is set and persisted
- [ ] Authenticated users are redirected from `/login` to `/dashboard`
- [ ] Unauthenticated users are redirected from protected routes to `/login`
- [ ] Sign out works correctly

**Recipe CRUD**:

- [ ] Create a new recipe with all fields (basic info, ingredients, steps, tags, images)
- [ ] Recipe form wizard navigates between steps correctly
- [ ] Per-step validation prevents advancing with missing required fields
- [ ] Created recipe appears in "My Recipes" page
- [ ] View recipe detail page with all sections (hero, metadata, ingredients, steps, nutrition, images)
- [ ] Edit an existing recipe (modify title, add/remove ingredients, change steps)
- [ ] Delete a recipe (confirmation dialog, recipe removed from list)
- [ ] Duplicate a recipe (copy created with " (Copy)" suffix, owned by current user)

**Search & Discovery**:

- [ ] Global search bar in header works (debounced, navigates to `/search`)
- [ ] Full-text search returns relevant results
- [ ] Filter by cuisine type
- [ ] Filter by difficulty
- [ ] Filter by dietary tags
- [ ] Filter by prep time
- [ ] Sort by newest, rating, prep time
- [ ] Clear all filters resets results
- [ ] Empty state shows when no results match
- [ ] URL-driven filters persist on page reload

**Tags & Collections**:

- [ ] Toggle Favorite tag on a recipe (heart icon)
- [ ] Toggle To Try tag on a recipe (bookmark icon)
- [ ] Toggle Made Before tag on a recipe (check icon)
- [ ] Multiple tags can be applied to the same recipe
- [ ] Save/unsave a recipe to collection
- [ ] My Collection page shows all tagged/saved recipes
- [ ] Tab filtering works (All, Favorites, To Try, Made Before, Saved)
- [ ] Tag counts update in tab labels

**Visibility & Sharing**:

- [ ] Change recipe visibility (Private → Shared → Public)
- [ ] Share recipe with a user by username
- [ ] Shared user can view the recipe
- [ ] Revoke share removes access
- [ ] Generate share link
- [ ] Share link provides access to the recipe
- [ ] Revoke share link removes access
- [ ] Share dialog user search works with autocomplete
- [ ] Shared with Me page shows recipes shared by others

**Ratings & Comments**:

- [ ] Rate a public/shared recipe (1-5 stars)
- [ ] Rating updates average rating display
- [ ] Cannot rate own recipe
- [ ] Add a comment to a public/shared recipe
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] Comment pagination works
- [ ] Empty comment section shows appropriate message

**Community & Guest Access**:

- [ ] Community page shows public recipes
- [ ] Guest (unauthenticated) can view community page
- [ ] Guest sees summary-only cards (no full ingredients/steps)
- [ ] Guest clicking a recipe sees login prompt
- [ ] Authenticated user sees full recipe details

**AI Features**:

- [ ] AI recipe generator: input ingredients, generate recipe, save as new
- [ ] Ingredient substitution: click substitute on an ingredient, see suggestions
- [ ] Nutrition estimation: estimate nutrition for a recipe, see results
- [ ] AI image generation: generate an image for a recipe (if OpenAI key configured)
- [ ] Rate limiting works (shows appropriate message when exceeded)

**Recipe Scaling & Cooking Mode**:

- [ ] Adjust servings with +/- buttons
- [ ] Ingredient quantities scale correctly
- [ ] Reset servings returns to original
- [ ] Enter cooking mode (full-screen step-by-step)
- [ ] Navigate between steps in cooking mode
- [ ] Step timer starts/pauses/resets
- [ ] Exit cooking mode

**Shopping Lists**:

- [ ] Create a new shopping list
- [ ] Add items manually
- [ ] Add recipe ingredients to a shopping list
- [ ] Check/uncheck items
- [ ] Delete items
- [ ] Delete a shopping list

**Print View**:

- [ ] Print recipe button triggers browser print dialog
- [ ] Print view shows clean layout (no nav/header/footer)

**Dark Mode**:

- [ ] Toggle dark mode from header dropdown
- [ ] All pages render correctly in dark mode
- [ ] Theme preference persists across page reloads

**Responsive Design**:

- [ ] Mobile viewport (< 640px): single column, hamburger menu, stacked layout
- [ ] Tablet viewport (640-1024px): two column, compact navigation
- [ ] Desktop viewport (> 1024px): full layout with sidebar filters
- [ ] Touch targets are at least 44px on mobile

**Keyboard Navigation**:

- [ ] Tab key navigates through interactive elements in logical order
- [ ] Enter key submits forms and activates buttons
- [ ] Escape key closes dialogs and modals
- [ ] Focus indicators are visible on all interactive elements
- [ ] Cmd/Ctrl + K opens search bar

**Patterns to follow**:

- Document each test result (pass/fail) in the Notes section
- Fix any failures that are bugs (not feature requests) before proceeding

---

### Section 2: Codebase Cleanup

**What to do**: Remove development artifacts from the codebase.

**Where to find context**:

- `docs/ROADMAP.md` Phase 13.3: "Remove TODOs, unused imports, console.logs, test/debug code"

**Specific requirements**:

- Search for and evaluate all `TODO`, `FIXME`, `HACK`, `XXX` comments:
  - Remove those that were resolved in prior tasks
  - Keep those that document known limitations or deferred work (convert to `NOTE:` or `KNOWN LIMITATION:`)
  - Document any remaining items in the Notes section
- Search for and remove `console.log` statements:
  - Remove all debug `console.log()` from production source files
  - Keep intentional `console.error()` in error handling code (server-side API routes)
  - Keep `console.error(error)` in `error.tsx` (client-side error boundary)
- Search for unused imports:
  - Run ESLint which should flag unused imports
  - Remove all unused imports
- Search for debug/test code in production files:
  - Remove any `// @ts-ignore` or `// @ts-expect-error` that are no longer needed
  - Remove any commented-out code blocks
  - Remove any hardcoded test data in production files

**Patterns to follow**:

- Use Grep tool to search for patterns across the codebase
- Per `docs/SENIOR_DEVELOPER.md`: clean, maintainable code with no dead code

---

### Section 3: Final Lint & Format Pass

**What to do**: Run linting and formatting tools and fix all issues.

**Where to find context**:

- `package.json` — `lint`, `format`, `format:check` scripts
- `.eslintrc.js` or `eslint.config.mjs` — ESLint configuration
- `.prettierrc` — Prettier configuration

**Specific requirements**:

- Run `npm run lint` — fix all errors (not just warnings)
- Run `npm run format` — auto-format all files
- Run `npm run format:check` — verify formatting is consistent
- Run `npm run build` one final time — verify clean build after all changes
- Run `npm run test` — verify all tests still pass after cleanup

**Patterns to follow**:

- Standard code quality workflow: lint → format → build → test

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run build` completes without errors after cleanup
- [ ] `npm run lint` passes with no errors
- [ ] `npm run format:check` passes
- [ ] `npm run test` — all tests pass

### Functional Verification

- [ ] All QA checklist items pass (or failures are documented with fixes applied)
- [ ] No `TODO`/`FIXME` comments remain without justification
- [ ] No `console.log` debug statements remain in production code
- [ ] No unused imports remain
- [ ] No commented-out code blocks remain

### Code Quality Checks

- [ ] Codebase is clean and production-ready
- [ ] All files follow consistent formatting (Prettier)
- [ ] No ESLint errors

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented
- [ ] No unrelated refactoring or cleanup was performed (beyond what's specified in Section 2)
- [ ] All bug fixes are traceable to QA failures discovered in Section 1
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_

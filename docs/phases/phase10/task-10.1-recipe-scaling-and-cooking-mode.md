---
task_id: 'task-10.1'
title: 'Recipe Scaling & Cooking Mode'
phase: 10
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.5'
  - 'task-5.7'
  - 'task-9.2'
blocks:
  - 'task-10.3'
  - 'task-11.2'
created_at: '2026-02-22'
---

# Recipe Scaling & Cooking Mode

## Current State

> The recipe detail page is fully implemented with ingredients (with checkbox toggles), step-by-step instructions (with optional durations), and all social/AI integrations. However, there is no way to adjust serving sizes and have ingredient quantities recalculate, no countdown timer tied to step durations, and no immersive cooking mode for mobile use.

- **What exists**:
  - Recipe detail page at `src/app/(main)/recipes/[id]/page.tsx` (lines 101-279) rendering all recipe data
  - `RecipeIngredients` component at `src/components/recipes/recipe-detail/recipe-ingredients.tsx` with checkbox toggles for cooking and AI substitution dialog
  - `RecipeSteps` component at `src/components/recipes/recipe-detail/recipe-steps.tsx` displaying numbered steps with optional duration badges
  - `RecipeDetail` type at `src/types/recipe.ts` (lines 73-96) with `ingredients[].quantity` (string | null), `steps[].duration` (number | null in minutes), and `servings` (number | null)
  - Prisma `RecipeIngredient.quantity` stored as free-text string (e.g., "2 cups", "1/2 tsp") at `prisma/schema.prisma:165`
  - Prisma `RecipeStep.duration` stored as optional integer (minutes) at `prisma/schema.prisma:179`
  - Prisma `Recipe.servings` stored as optional integer at `prisma/schema.prisma:108`
- **What is missing**:
  - `src/lib/scaling.ts` — quantity parsing and scaling logic
  - `src/components/recipes/serving-adjuster.tsx` — UI for adjusting servings
  - `src/components/recipes/cooking-timer.tsx` — per-step countdown timer
  - `src/components/recipes/cooking-mode.tsx` — full-screen step-by-step cooking overlay
  - Integration of all three into the recipe detail page
  - Tests for scaling math, timer, and cooking mode
- **Relevant code**:
  - `src/app/(main)/recipes/[id]/page.tsx` — integration target
  - `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — must receive scaled quantities
  - `src/components/recipes/recipe-detail/recipe-steps.tsx` — must receive timer integration
  - `src/types/recipe.ts:73-96` — `RecipeDetail` type definition

---

## Desired Outcome

- **End state**: Users can adjust servings on the recipe detail page and see all ingredient quantities recalculate in real-time. Each step with a duration has a start/pause/reset countdown timer. A "Cooking Mode" button opens a full-screen, mobile-optimized overlay showing one step at a time with navigation, timer, and an ingredient reference panel.
- **User-facing changes**:
  - Serving adjuster (+/- buttons) appears above the ingredients list
  - All ingredient quantities scale proportionally when servings change
  - Timer buttons appear on steps with a `duration` value
  - "Start Cooking" button opens full-screen cooking mode
  - Cooking mode: large text, one step at a time, swipe/arrow navigation, step progress, per-step timer, ingredient panel, exit button
  - Audio alert when a timer completes
- **Developer-facing changes**:
  - New file: `src/lib/scaling.ts` — `scaleQuantity()` and `parseQuantity()` functions
  - New file: `src/components/recipes/serving-adjuster.tsx` — client component
  - New file: `src/components/recipes/cooking-timer.tsx` — client component
  - New file: `src/components/recipes/cooking-mode.tsx` — client component
  - Modified: `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — accepts optional `scaleFactor` prop
  - Modified: `src/components/recipes/recipe-detail/recipe-steps.tsx` — integrates timer buttons
  - Modified: `src/app/(main)/recipes/[id]/page.tsx` — adds serving adjuster, cooking mode entry point
  - New tests in co-located `__tests__/` directories

---

## Scope & Boundaries

### In Scope

- `src/lib/scaling.ts` — quantity parsing (fractions, decimals, ranges, unit-less) and scaling math
- `src/components/recipes/serving-adjuster.tsx` — +/- buttons, display, reset, real-time ingredient updates via scaling factor
- `src/components/recipes/cooking-timer.tsx` — per-step countdown (MM:SS), start/pause/reset, audio alert, multiple concurrent timers, visual indicator
- `src/components/recipes/cooking-mode.tsx` — full-screen overlay, one step at a time, navigation (swipe/arrows), step progress, integrated timer, ingredient slide-up panel, Wake Lock API for mobile, exit button
- Integration of all components into the recipe detail page
- Unit tests for scaling logic, component tests for timer and cooking mode

### Out of Scope

- Shopping list feature (Task 10.2)
- Print view (Task 10.3)
- Persisting timer state across page reloads (client-side only, lost on navigation)
- Adding `duration` field to steps that don't already have one (existing data only)
- Any API routes — this task is entirely client-side
- Modifying the Prisma schema or database

### Dependencies

- Task 5.5 (Recipe detail page) must be complete — **verified: complete**
- Task 5.7 (React Query hooks for recipes) must be complete — **verified: complete**
- Task 9.2 (Ingredient substitution integrated into recipe-ingredients) must be complete — **verified: complete**

---

## Implementation Details

### Section 1: Scaling Utility Library

**What to do**: Create `src/lib/scaling.ts` with pure functions for parsing and scaling ingredient quantities.

**Where to find context**:

- `docs/ROADMAP.md` lines 841-843 — scaling requirements
- `docs/SENIOR_DEVELOPER.md` — Phase 7a scaling specification
- `prisma/schema.prisma:165` — `RecipeIngredient.quantity` is a free-text string

**Specific requirements**:

- `parseQuantity(quantity: string): { value: number; unit: string; prefix: string; suffix: string } | null` — extract numeric value and unit from strings like "2 cups", "1/2 tsp", "2.5 oz", "2-3 cloves", "3 eggs", "pinch of salt"
- Handle fraction parsing: "1/2", "1 1/2", "3/4"
- Handle decimal parsing: "2.5", "0.75"
- Handle range parsing: "2-3" (scale both bounds)
- Handle unit-less: "3 eggs" (just scale the number)
- Handle non-scalable terms: "pinch", "to taste", "as needed" — return as-is
- `scaleQuantity(quantity: string | null, factor: number): string | null` — scale quantity by factor, return formatted string
- Scaling formula: `newQuantity = originalQuantity * factor` where `factor = newServings / originalServings`
- Round to sensible precision: whole numbers for clean results (e.g., 2.0 → "2"), one decimal for others (e.g., 1.333 → "1.3"), keep fractions as fractions where sensible (e.g., 0.5 → "1/2")
- Export all functions as named exports

**Patterns to follow**:

- Pure functions, no side effects, fully testable
- Follow `docs/SENIOR_DEVELOPER.md` lib utility conventions: JSDoc comments, named exports

---

### Section 2: Serving Adjuster Component

**What to do**: Create `src/components/recipes/serving-adjuster.tsx` as a client component that provides +/- buttons to adjust servings and computes the scaling factor.

**Where to find context**:

- `docs/ROADMAP.md` lines 846-848 — serving adjuster requirements
- `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — current ingredients display

**Specific requirements**:

- Props: `originalServings: number`, `onScaleFactorChange: (factor: number) => void`
- Display: "X servings" with +/- buttons (decrement min 1, no upper hard limit but warn above 20x original)
- "Reset" button to return to original servings
- Compute factor: `newServings / originalServings` and call `onScaleFactorChange`
- Accessible: ARIA labels on buttons, announce changes to screen readers
- Use shadcn/ui `Button` component

**Patterns to follow**:

- `'use client'` directive
- Follow `.claude/client-component-skill.md` pattern: constants at top, helper functions, props interface, named export

---

### Section 3: Cooking Timer Component

**What to do**: Create `src/components/recipes/cooking-timer.tsx` as a client component with per-step countdown timers.

**Where to find context**:

- `docs/ROADMAP.md` lines 849-853 — timer requirements
- `src/components/recipes/recipe-detail/recipe-steps.tsx` — current step display with duration badges

**Specific requirements**:

- Props: `durationMinutes: number`, `stepNumber: number`, `onComplete?: () => void`
- Countdown display: MM:SS format
- Controls: Start, Pause, Reset buttons
- Audio alert on completion: use Web Audio API or `HTMLAudioElement` with a short notification sound (generate a beep via AudioContext)
- Multiple concurrent timers supported — each timer instance manages its own state
- Visual indicator: show timer badge changes color (neutral → active/green → completed/red)
- Use `useEffect` with `setInterval` for countdown; clean up on unmount
- Handle tab visibility changes: timers should continue counting when tab is hidden (use `Date.now()` based calculation rather than relying on interval accuracy)

**Patterns to follow**:

- `'use client'` directive
- Follow `.claude/client-component-skill.md` conventions

---

### Section 4: Cooking Mode Component

**What to do**: Create `src/components/recipes/cooking-mode.tsx` as a full-screen overlay for step-by-step cooking.

**Where to find context**:

- `docs/ROADMAP.md` lines 854-858 — cooking mode requirements
- `src/types/recipe.ts:83-95` — `RecipeDetail['ingredients']` and `RecipeDetail['steps']` types

**Specific requirements**:

- Props: `steps: RecipeDetail['steps']`, `ingredients: RecipeDetail['ingredients']`, `recipeName: string`, `scaleFactor?: number`, `onClose: () => void`
- Full-screen overlay (fixed position, z-50, dark background)
- One step displayed at a time with large, readable text
- Navigation: Previous/Next buttons, swipe gestures (touch events), left/right arrow keys
- Step progress indicator: "Step X of Y" with progress bar
- Per-step timer: integrate `CookingTimer` for steps with `duration`
- Ingredient slide-up panel: button to show/hide scaled ingredient list
- Wake Lock API integration: request screen wake lock on mount, release on unmount (with feature detection fallback)
- Exit button: always visible (top-right), confirm if timer is running
- Mobile optimized: large tap targets (min 44px), high contrast text, large font sizes
- Keyboard accessible: Escape to exit, arrow keys to navigate

**Patterns to follow**:

- `'use client'` directive
- Follow `.claude/client-component-skill.md` conventions
- Use shadcn/ui `Button`, `Sheet` (for ingredient panel), `Progress`

---

### Section 5: Integration into Recipe Detail Page

**What to do**: Wire serving adjuster, timer buttons, and cooking mode entry point into the existing recipe detail page and its sub-components.

**Where to find context**:

- `src/app/(main)/recipes/[id]/page.tsx` — server component, passes data to client components
- `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — needs `scaleFactor` prop
- `src/components/recipes/recipe-detail/recipe-steps.tsx` — needs timer integration

**Specific requirements**:

- Create a new client wrapper component `src/components/recipes/recipe-detail/recipe-detail-client.tsx` that manages the scaling state and cooking mode state, wrapping the ingredients and steps sections
- The server page passes recipe data to this client wrapper
- `RecipeIngredients`: add optional `scaleFactor` prop; apply `scaleQuantity()` to each ingredient's quantity before rendering
- `RecipeSteps`: add optional `showTimers` prop; render `CookingTimer` next to each step that has a `duration`
- Add "Start Cooking" button (prominent CTA) that opens the cooking mode overlay
- The serving adjuster appears above the ingredients list
- Ensure the existing substitution dialog still works alongside scaling

**Patterns to follow**:

- Server components pass data to client components (no `'use client'` on the page itself)
- Follow the existing pattern in `recipe-detail/` directory structure

---

### Section 6: Tests

**What to do**: Write tests for scaling logic, timer, serving adjuster, and cooking mode.

**Where to find context**:

- `src/test/setup.ts` — test setup with MSW and @testing-library/jest-dom
- `vitest.config.ts` — Vitest configuration
- `src/test/factories.ts` — mock data factories (use `createMockRecipeDetail`, `createMockRecipeStep`, `createMockRecipeIngredient`)

**Specific requirements**:

- `src/lib/__tests__/scaling.test.ts`:
  - Parsing: whole numbers, fractions ("1/2", "1 1/2"), decimals ("2.5"), ranges ("2-3"), unit-less ("3 eggs")
  - Non-scalable: "pinch", "to taste", "as needed" returned unchanged
  - Scaling: factor 2 doubles, factor 0.5 halves, factor 1 unchanged
  - Edge cases: null input, empty string, zero factor, negative factor, very large factor
  - Rounding: sensible output formatting
- `src/components/recipes/__tests__/serving-adjuster.test.tsx`:
  - Renders with initial servings
  - Increment/decrement updates display and calls onScaleFactorChange
  - Cannot go below 1 serving
  - Reset returns to original
- `src/components/recipes/__tests__/cooking-timer.test.tsx`:
  - Renders with correct initial time (MM:SS)
  - Start begins countdown
  - Pause stops countdown
  - Reset returns to initial time
  - Calls onComplete when reaching 0
- `src/components/recipes/__tests__/cooking-mode.test.tsx`:
  - Renders first step
  - Navigation (next/previous) changes displayed step
  - Shows progress indicator
  - Shows ingredient panel when toggled
  - Calls onClose on exit

**Patterns to follow**:

- Co-locate tests in `__tests__/` directories adjacent to source files
- Follow `.claude/test-file-skill.md` conventions: `vi.mock()` for modules, `vi.hoisted()` for hoisted mocks
- Use `@testing-library/react` `render`, `screen`, `fireEvent`/`userEvent`
- Use factories from `src/test/factories.ts`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] Serving adjuster renders above ingredients with +/- buttons
- [ ] Changing servings updates all ingredient quantities in real-time
- [ ] Fraction quantities (e.g., "1/2 cup") scale correctly (e.g., "1 cup" at 2x)
- [ ] Decimal quantities (e.g., "2.5 oz") scale correctly
- [ ] Range quantities (e.g., "2-3 cloves") scale both bounds
- [ ] Non-scalable terms ("pinch", "to taste") remain unchanged
- [ ] Reset button returns to original servings and quantities
- [ ] Timer countdown displays MM:SS format and counts down when started
- [ ] Pause stops the countdown, resume continues from paused time
- [ ] Reset returns timer to original duration
- [ ] Audio alert plays when timer reaches 0
- [ ] Multiple timers run concurrently without interference
- [ ] Cooking mode opens as full-screen overlay
- [ ] Steps navigate forward/backward with buttons
- [ ] Step progress shows "Step X of Y"
- [ ] Ingredient panel slides up when toggled
- [ ] Escape key and exit button close cooking mode
- [ ] Cooking mode renders correctly on mobile viewport

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] All new components use `'use client'` directive where needed
- [ ] Scaling utility has JSDoc comments on exported functions

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

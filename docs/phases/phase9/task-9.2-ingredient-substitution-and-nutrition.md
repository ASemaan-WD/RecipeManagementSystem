---
task_id: 'task-9.2'
title: 'Ingredient Substitution & Nutritional Estimates'
phase: 9
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-9.1'
  - 'task-5.4'
blocks:
  - 'task-9.3'
created_at: '2026-02-21'
---

# Ingredient Substitution & Nutritional Estimates

## Current State

> The AI infrastructure (OpenAI client, rate limiter, retry utility, error handler) was built in task-9.1. The validation schemas for substitution (`ingredientSubstituteSchema`) and nutrition (`nutritionEstimateSchema`) were pre-defined in `src/lib/validations/ai.ts`. The AI types (`AISubstitution`, `AINutritionEstimate`) were pre-defined in `src/types/ai.ts`. The `Recipe.nutritionData` JSON field exists in Prisma for caching nutrition estimates. The nutrition-section component exists on the recipe detail page as a placeholder. However, no substitution or nutrition API routes, no substitution UI, and no actual AI calls for these features exist.

- **What exists**:
  - OpenAI client singleton (`src/lib/openai.ts` — task-9.1)
  - Rate limiters: `substituteRateLimiter` (50/hr), `nutritionRateLimiter` (30/hr) (`src/lib/rate-limit.ts` — task-9.1)
  - `withAIRetry()` and `formatAIError()` utilities (`src/lib/ai-utils.ts` — task-9.1)
  - `ingredientSubstituteSchema` validation schema (`src/lib/validations/ai.ts` — task-9.1)
  - `AISubstitution` and `AINutritionEstimate` types (`src/types/ai.ts` — task-9.1)
  - `Recipe.nutritionData` JSON field for caching (`prisma/schema.prisma`)
  - `nutrition-section.tsx` placeholder on recipe detail page (`src/components/recipes/recipe-detail/nutrition-section.tsx`)
  - Recipe detail page with ingredients list (`src/app/(main)/recipes/[id]/page.tsx`)
  - `canViewRecipe()` and `requireAuth()` auth utilities (`src/lib/auth-utils.ts`)
  - Prisma client singleton (`src/lib/db.ts`)
- **What is missing**:
  - `src/app/api/ai/substitute/route.ts` — Ingredient substitution endpoint
  - `src/app/api/ai/nutrition/[recipeId]/route.ts` — Nutrition estimation endpoint
  - `src/components/ai/substitution-dialog.tsx` — Substitution suggestion UI
  - `src/components/ai/nutrition-display.tsx` — Nutrition display card (replace placeholder)
  - `src/hooks/use-ai.ts` additions — Substitution and nutrition hooks
  - Tests for all of the above
- **Relevant code**:
  - `src/lib/openai.ts` — OpenAI client
  - `src/lib/rate-limit.ts` — Rate limiters
  - `src/lib/ai-utils.ts` — Retry and error utilities
  - `src/lib/validations/ai.ts` — Pre-defined schemas
  - `src/types/ai.ts` — Pre-defined types
  - `src/components/recipes/recipe-detail/nutrition-section.tsx` — Existing placeholder
  - `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — Where substitution button goes
  - `docs/CTO_SPECS.md` (lines 582-583) — AI API contract for substitute and nutrition
  - `docs/SENIOR_DEVELOPER.md` (lines 450-488) — Substitution and nutrition specs

---

## Desired Outcome

- **End state**: Users can click a "Substitute" button next to any ingredient on the recipe detail page to get 2-3 AI-powered substitution suggestions. Users can click "Estimate Nutrition" on the recipe detail page to get AI-estimated per-serving nutrition data, which is cached in the database for subsequent views.
- **User-facing changes**:
  - Each ingredient on recipe detail has a "Substitute" button that opens a dialog with suggestions
  - Recipe detail page shows a nutrition card with estimated per-serving values (or "Estimate Nutrition" button if not yet calculated)
  - Nutrition estimates cached — instant display on subsequent views
  - AI disclaimer shown on both features
- **Developer-facing changes**:
  - `src/app/api/ai/substitute/route.ts` — Substitution API endpoint
  - `src/app/api/ai/nutrition/[recipeId]/route.ts` — Nutrition estimation endpoint
  - `src/components/ai/substitution-dialog.tsx` — Substitution dialog component
  - `src/components/ai/nutrition-display.tsx` — Nutrition display component
  - Updated `src/hooks/use-ai.ts` — Substitution and nutrition hooks
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create ingredient substitution API route (request-response, not streaming)
- Create nutrition estimation API route (request-response, cached)
- Create substitution dialog UI component with suggestions display
- Create nutrition display component (replacing the existing placeholder)
- Add substitution and nutrition hooks to `use-ai.ts`
- Cache nutrition results in `Recipe.nutritionData` JSON field
- Invalidate nutrition cache when recipe ingredients are edited
- Rate limit both endpoints using pre-configured limiters
- Write tests for API routes, components, and hooks

### Out of Scope

- AI image generation (DALL-E) — task-9.3
- Smart tagging and meal planning — task-9.3
- Integrating substitution button into ingredient list on recipe detail — task-9.3 (entry points)
- Integrating nutrition display into recipe detail — task-9.3 (entry points)
- The AI infrastructure itself (client, rate limiter, retry) — task-9.1
- Actual OpenAI API calls in tests (mock everything)

### Dependencies

- AI infrastructure complete (task-9.1): OpenAI client, rate limiter, retry utility, error handler
- Validation schemas pre-defined (task-9.1): `ingredientSubstituteSchema`
- Types pre-defined (task-9.1): `AISubstitution`, `AINutritionEstimate`
- Recipe detail page exists (task-5.4 — done)
- Recipe ingredients display exists (`src/components/recipes/recipe-detail/recipe-ingredients.tsx` — done)

---

## Implementation Details

### Section 1: Ingredient Substitution API Route (`src/app/api/ai/substitute/route.ts`)

**What to do**: Create POST endpoint for ingredient substitution suggestions.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 450-467) — Substitution spec
- `docs/CTO_SPECS.md` (line 582) — `POST /api/ai/substitute`

**Specific requirements**:

1. **POST** `/api/ai/substitute`:
   - Require authentication via `requireAuth()`
   - Check rate limit via `checkRateLimit(substituteRateLimiter, userId)`
   - Validate body against `ingredientSubstituteSchema`
   - Build a prompt that includes:
     - The ingredient to substitute
     - Recipe context (other ingredients, cooking method) if provided
     - Dietary restrictions if provided
   - **System prompt**: Instruct the model to act as a culinary expert and suggest 2-3 substitutions. Each substitution should include: name, quantity ratio (e.g., "1:1"), and notes about flavor/texture differences and dietary compatibility.
   - Request JSON response matching `{ substitutions: AISubstitution[] }`
   - Use `generateText()` from Vercel AI SDK (not streaming — responses are short)
   - Wrap with `withAIRetry(fn, 'substitute')`
   - Parse the AI response as JSON
   - Return `{ substitutions: AISubstitution[] }`

2. **Error handling**:
   - If AI response is not valid JSON → return 503 with formatted error
   - If rate limited → return 429
   - Never expose OpenAI internals

**Patterns to follow**:

- Use `generateText` from `ai` package (Vercel AI SDK) for non-streaming
- Follow auth + rate limit pattern from `src/app/api/ai/generate/route.ts`

---

### Section 2: Nutrition Estimation API Route (`src/app/api/ai/nutrition/[recipeId]/route.ts`)

**What to do**: Create POST endpoint for AI-powered nutrition estimation with caching.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 468-488) — Nutrition spec
- `docs/CTO_SPECS.md` (line 583) — `POST /api/ai/nutrition/[recipeId]`

**Specific requirements**:

1. **POST** `/api/ai/nutrition/:recipeId`:
   - Require authentication via `requireAuth()`
   - Check rate limit via `checkRateLimit(nutritionRateLimiter, userId)`
   - Fetch the recipe with ingredients (include `RecipeIngredient` with `Ingredient` names and quantities)
   - Return 404 if recipe not found or user cannot view it

2. **Cache check**:
   - If `recipe.nutritionData` is not null → return cached data immediately (no AI call, no rate limit count)
   - Only count toward rate limit when an actual AI call is made

3. **AI estimation** (when not cached):
   - Build a prompt listing all ingredients with quantities and the number of servings
   - **System prompt**: Instruct the model to estimate per-serving nutrition (calories, protein in grams, carbs in grams, fat in grams, fiber in grams, sugar in grams, sodium in mg). Return as JSON matching `AINutritionEstimate`.
   - Use `generateText()` (not streaming — single JSON response)
   - Wrap with `withAIRetry(fn, 'nutrition')`
   - Parse the AI response as JSON
   - **Cache the result**: Update `recipe.nutritionData` with the parsed nutrition data
   - Return the nutrition data

4. **Cache invalidation**:
   - When recipe ingredients are updated (in `PUT /api/recipes/:id`), clear `nutritionData` by setting it to `null`
   - This is done by modifying the existing recipe update route (small surgical change)

**Patterns to follow**:

- Follow auth + rate limit + AI retry pattern
- Use Prisma `update` for caching

---

### Section 3: Substitution Dialog Component (`src/components/ai/substitution-dialog.tsx`)

**What to do**: Create the UI for displaying ingredient substitution suggestions.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 463-467) — Substitution UI spec
- `docs/ROADMAP.md` (lines 801-803) — Substitution dialog spec

**Specific requirements**:

1. **Props interface**: `{ ingredientName: string; recipeContext?: string }`
2. **Trigger**: A small button (e.g., swap icon) next to an ingredient that opens a dialog/popover
3. **Dialog content**:
   - Title: "Substitutions for [ingredient name]"
   - Loading state while AI processes
   - List of 2-3 suggestions, each showing:
     - Substitute name (bold)
     - Quantity ratio (e.g., "Use 1:1 ratio")
     - Notes about flavor/texture differences
   - AI disclaimer: "AI-generated suggestions. Results may vary."
4. **Error state**: Show error message with retry button
5. **Rate limit state**: Show message when rate limited

**Patterns to follow**:

- `'use client'` component
- Use shadcn/ui: Dialog or Popover, Button, Badge
- Use toast for errors

---

### Section 4: Nutrition Display Component (`src/components/ai/nutrition-display.tsx`)

**What to do**: Create the nutrition facts card to replace the existing placeholder.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 484-488) — Nutrition UI spec
- `docs/ROADMAP.md` (lines 807-809) — Nutrition display spec
- `src/components/recipes/recipe-detail/nutrition-section.tsx` — Existing placeholder

**Specific requirements**:

1. **Props interface**: `{ recipeId: string; nutritionData: AINutritionEstimate | null; isOwner: boolean }`
2. **When nutrition data exists** (cached):
   - Display a compact nutrition facts card with: calories, protein, carbs, fat, fiber, sugar, sodium per serving
   - Visual layout: grid or list format, clearly labeled values with units
   - "Refresh" button (re-estimates, clears cache) — only for recipe owner
   - AI disclaimer: "AI-estimated values. Actual nutrition may vary."
3. **When nutrition data is null**:
   - "Estimate Nutrition" button with sparkle/AI icon
   - Click → calls the nutrition API → displays results
   - Loading state during estimation
4. **Collapsible**: Can be expanded/collapsed to save space

**Patterns to follow**:

- `'use client'` component
- Use shadcn/ui: Card, Button, Collapsible
- Follow existing `nutrition-section.tsx` for placement

---

### Section 5: AI Hooks Additions (`src/hooks/use-ai.ts`)

**What to do**: Add substitution and nutrition hooks to the existing AI hooks file.

**Where to find context**:

- `src/hooks/use-ai.ts` — Existing file from task-9.1
- `src/hooks/use-tags.ts` — Pattern for mutation hooks

**Specific requirements**:

1. **`useIngredientSubstitution()`** — Mutation hook for substitution
   - Calls `POST /api/ai/substitute`
   - On success: return substitutions data
   - On error: toast with user-friendly message
   - No caching (unique per request)

2. **`useNutritionEstimate(recipeId)`** — Query hook for nutrition data
   - Query key: `['recipe-nutrition', recipeId]`
   - Initially use the cached data from recipe detail if available (pass as `initialData`)
   - `enabled`: Only when recipeId is provided
   - `staleTime`: 5 minutes (nutrition data is cached server-side)

3. **`useEstimateNutrition()`** — Mutation hook to trigger nutrition estimation
   - Calls `POST /api/ai/nutrition/:recipeId`
   - On success: invalidate `['recipe-nutrition', recipeId]` and `['recipe', recipeId]` (to refresh cached data)
   - On error: toast with user-friendly message

**Patterns to follow**:

- Follow existing hooks in `src/hooks/use-ai.ts` from task-9.1

---

### Section 6: Nutrition Cache Invalidation

**What to do**: Clear nutrition cache when recipe ingredients are updated.

**Where to find context**:

- `src/app/api/recipes/[id]/route.ts` — Existing recipe update route

**Specific requirements**:

1. In the PUT handler of `src/app/api/recipes/[id]/route.ts`:
   - When the request body includes ingredient changes (new ingredients, removed ingredients, or changed quantities)
   - Set `nutritionData: null` in the recipe update query (Prisma `data` object)
   - This is a **minimal surgical change** — add one field to the existing update

**Patterns to follow**:

- Minimal change to existing code — add `nutritionData: null` conditionally

---

### Section 7: Tests

**What to do**: Write tests for substitution and nutrition API routes, components, and hooks.

**Where to find context**:

- `src/app/api/ai/generate/__tests__/route.test.ts` — AI route test pattern from task-9.1

**Specific requirements**:

**Substitution API Tests** (`src/app/api/ai/substitute/__tests__/route.test.ts`):

- POST with valid input → returns 2-3 substitutions
- POST validates ingredient name (min 1 char)
- POST requires auth → 401
- POST rate limited → 429
- POST handles AI failure → 503 with user-friendly message
- Substitution response structure matches `AISubstitution[]`

**Nutrition API Tests** (`src/app/api/ai/nutrition/[recipeId]/__tests__/route.test.ts`):

- POST returns cached data immediately when `nutritionData` exists (no AI call)
- POST calls AI and caches result when `nutritionData` is null
- POST requires auth → 401
- POST with non-existent recipe → 404
- POST rate limited → 429 (only when AI call is made)
- POST handles AI failure → 503
- Nutrition response matches `AINutritionEstimate` structure

**Substitution Dialog Tests** (`src/components/ai/__tests__/substitution-dialog.test.tsx`):

- Renders trigger button
- Opens dialog on click
- Shows loading state during AI call
- Displays substitution suggestions after response
- Shows error state on failure
- Shows AI disclaimer

**Nutrition Display Tests** (`src/components/ai/__tests__/nutrition-display.test.tsx`):

- Renders nutrition facts when data exists
- Shows "Estimate Nutrition" button when no data
- Shows loading state during estimation
- Shows AI disclaimer
- Refresh button visible for owner only

**Cache Invalidation Tests**:

- Recipe update with ingredient changes clears nutritionData
- Recipe update without ingredient changes preserves nutritionData

**Patterns to follow**:

- Mock `generateText` from `ai` package — never make real API calls
- Mock Prisma for database operations
- Co-located `__tests__/` directory pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] POST `/api/ai/substitute` returns 2-3 substitutions with name, ratio, notes
- [ ] POST `/api/ai/substitute` requires auth and respects rate limits
- [ ] POST `/api/ai/nutrition/:recipeId` returns nutrition data and caches it
- [ ] Subsequent calls to nutrition endpoint return cached data immediately
- [ ] Nutrition cache cleared when recipe ingredients are updated
- [ ] Substitution dialog shows suggestions in a clear format
- [ ] Nutrition display shows per-serving values when data exists
- [ ] "Estimate Nutrition" button triggers AI estimation and displays result
- [ ] AI disclaimers shown on both features
- [ ] Error states handled gracefully with user-friendly messages
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] OpenAI error details never exposed to users
- [ ] Nutrition caching implemented correctly (cache on estimate, clear on ingredient update)
- [ ] AI prompts are clear and produce well-structured JSON

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

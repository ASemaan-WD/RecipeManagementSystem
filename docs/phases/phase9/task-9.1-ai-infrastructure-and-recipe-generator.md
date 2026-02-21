---
task_id: 'task-9.1'
title: 'AI Infrastructure & Recipe Generator'
phase: 9
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
blocks:
  - 'task-9.2'
  - 'task-9.3'
created_at: '2026-02-21'
---

# AI Infrastructure & Recipe Generator

## Current State

> No AI infrastructure exists in the codebase. The project has `ai` and `@ai-sdk/openai` listed as dependencies in `package.json` (installed in Phase 1), and `OPENAI_API_KEY` is defined in `.env.example`. The `Recipe.nutritionData` JSON field and `ImageSource.AI_GENERATED` enum exist in the Prisma schema but are unused. No OpenAI client, rate limiter, error handler, AI prompts, or AI API routes have been implemented.

- **What exists**:
  - `ai` and `@ai-sdk/openai` packages installed (`package.json`)
  - `OPENAI_API_KEY` in `.env.example`
  - `Recipe.nutritionData` JSON field for cached nutrition estimates (`prisma/schema.prisma`)
  - `ImageSource.AI_GENERATED` enum value (`prisma/schema.prisma`)
  - `RecipeImage` model with `source` field that accepts `AI_GENERATED` (`prisma/schema.prisma`)
  - Recipe form images step with placeholder for AI generation (`src/components/recipes/recipe-form/images-step.tsx`)
  - Nutrition section component with placeholder display (`src/components/recipes/recipe-detail/nutrition-section.tsx`)
  - Middleware protects `/ai/*` routes (`middleware.ts`, line 14)
  - `RecipeFormData` type and `createRecipeSchema` validation (`src/types/recipe.ts`, `src/lib/validations/recipe.ts`)
  - Prisma client singleton (`src/lib/db.ts`)
  - Auth utilities (`src/lib/auth-utils.ts`)
- **What is missing**:
  - `src/lib/openai.ts` — OpenAI client singleton
  - `src/lib/rate-limit.ts` — Per-user rate limiter
  - `src/lib/ai-utils.ts` — AI retry + error formatting utilities
  - `src/app/api/ai/generate/route.ts` — Recipe generation endpoint (streaming)
  - `src/components/ai/recipe-generator.tsx` — Recipe generator UI
  - `src/app/(main)/ai/generate/page.tsx` — "What's in your fridge?" page
  - `src/hooks/use-ai.ts` — AI feature hooks
  - `src/lib/validations/ai.ts` — AI request validation schemas
  - `src/types/ai.ts` — AI response types
  - Tests for all of the above
- **Relevant code**:
  - `package.json` — `ai` and `@ai-sdk/openai` dependencies
  - `prisma/schema.prisma` — nutritionData, ImageSource, RecipeImage
  - `src/lib/auth-utils.ts` — requireAuth
  - `src/types/recipe.ts` — RecipeFormData type
  - `docs/CTO_SPECS.md` (lines 151-179) — AI provider decisions and feature table
  - `docs/CTO_SPECS.md` (lines 579-586) — AI API contract
  - `docs/SENIOR_DEVELOPER.md` (lines 353-449) — AI implementation details

---

## Desired Outcome

- **End state**: A complete AI infrastructure (OpenAI client, rate limiter, retry/error handling) plus a working recipe generator that uses GPT-4o-mini with streaming via Vercel AI SDK. Users can input available ingredients and preferences, and receive a streaming recipe generation that they can save.
- **User-facing changes**: An "AI Generate" page at `/ai/generate` where users input ingredients, select preferences, and receive a streaming AI-generated recipe. A "Save as New Recipe" button creates a real recipe from the AI output.
- **Developer-facing changes**:
  - `src/lib/openai.ts` — OpenAI client singleton
  - `src/lib/rate-limit.ts` — In-memory per-user rate limiter
  - `src/lib/ai-utils.ts` — Retry + error utilities
  - `src/app/api/ai/generate/route.ts` — Streaming recipe generation endpoint
  - `src/components/ai/recipe-generator.tsx` — Generator UI component
  - `src/app/(main)/ai/generate/page.tsx` — Generator page
  - `src/hooks/use-ai.ts` — AI hooks
  - `src/lib/validations/ai.ts` — AI validation schemas
  - `src/types/ai.ts` — AI types
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create OpenAI client singleton with API key from env
- Create in-memory sliding window rate limiter (per user ID, configurable limits)
- Create AI retry utility (`withAIRetry`) and error formatting (`formatAIError`)
- Create recipe generation API route with Vercel AI SDK streaming (`streamText`)
- Create recipe generator UI with ingredient input, preferences, streaming output
- Create "What's in your fridge?" page at `/ai/generate`
- Create AI validation schemas and types
- Create React hooks for AI features
- Define rate limits: 20 requests/hour for recipe generation
- Write tests for rate limiter, retry utility, error handler, API route, and component

### Out of Scope

- Ingredient substitution — task-9.2
- Nutritional estimates — task-9.2
- AI image generation (DALL-E) — task-9.3
- Smart tagging (nice-to-have) — task-9.3
- Meal planning (nice-to-have) — task-9.3
- Integrating AI entry points into recipe detail page — task-9.3
- Actual OpenAI API calls in tests (all tests mock OpenAI)

### Dependencies

- Recipe CRUD API routes functional (task-5.1 — done)
- `ai` and `@ai-sdk/openai` packages installed (done)
- `OPENAI_API_KEY` configured in environment (done in `.env.example`)
- Auth utilities exist (`requireAuth`) (done)

---

## Implementation Details

### Section 1: OpenAI Client Singleton (`src/lib/openai.ts`)

**What to do**: Create the OpenAI client singleton and define model constants.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 357-362) — OpenAI setup
- `docs/CTO_SPECS.md` (lines 73-77) — AI technology choices

**Specific requirements**:

1. Create and export an OpenAI client instance using the `openai` package
2. Read `OPENAI_API_KEY` from environment variables
3. Define and export model constants:
   - `TEXT_MODEL = 'gpt-4o-mini'` — for text generation
   - `IMAGE_MODEL = 'dall-e-3'` — for image generation (used in task-9.3)
4. Throw a clear error at startup if `OPENAI_API_KEY` is not set (guard against runtime failures)

**Patterns to follow**:

- Follow `src/lib/db.ts` — singleton pattern with `globalThis` caching for Next.js hot reload
- Export named constants, not default exports

---

### Section 2: Rate Limiter (`src/lib/rate-limit.ts`)

**What to do**: Create an in-memory per-user sliding window rate limiter.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 369-372) — Rate limiter spec
- `docs/CTO_SPECS.md` (line 603) — Rate limits per feature
- `docs/ROADMAP.md` (lines 778-779) — Rate limiter details

**Specific requirements**:

1. **`RateLimiter` class or function-based module**:
   - Constructor takes: `windowMs` (window duration in ms), `maxRequests` (max requests per window)
   - `check(identifier: string): { allowed: boolean; remaining: number; resetAt: Date }`
   - Uses a `Map<string, { timestamps: number[] }>` stored on `globalThis` for persistence across hot reloads
   - Sliding window: count requests within the last `windowMs` milliseconds
   - Remove expired timestamps on each check (cleanup)

2. **Pre-configured rate limiters** (exported):
   - `generateRateLimiter`: 20 requests / 1 hour (3600000 ms)
   - `substituteRateLimiter`: 50 requests / 1 hour
   - `dalleRateLimiter`: 10 requests / 1 hour
   - `nutritionRateLimiter`: 30 requests / 1 hour

3. **Helper function**: `checkRateLimit(limiter, userId): NextResponse | null`
   - Returns `null` if allowed (proceed)
   - Returns a 429 `NextResponse` if rate limited, with:
     - `error` message: "Rate limit exceeded. Please try again later."
     - `remaining` and `resetAt` in response headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
   - Never expose internal rate limit counts to the user per `docs/SENIOR_DEVELOPER.md` (line 1047)

**Patterns to follow**:

- Pure module with no framework dependencies
- Fully testable — rate limiter behavior is deterministic based on timestamps

---

### Section 3: AI Utilities (`src/lib/ai-utils.ts`)

**What to do**: Create the retry-once pattern and error formatting utilities.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 376-400) — AI error handling spec (locked)
- `docs/ROADMAP.md` (lines 781-783) — AI utility specs

**Specific requirements**:

1. **`withAIRetry<T>(fn: () => Promise<T>, action: string): Promise<T>`**:
   - Call `fn()` once
   - On failure: log error with `console.error` (include `action` for context)
   - Retry once (same function call)
   - On second failure: log error, throw with user-friendly message from `formatAIError(action)`
   - Never expose OpenAI error internals to the user

2. **`formatAIError(action: string): string`**:
   - Map `action` to user-friendly message:
     - `'generate'` → `'Could not generate recipe. Please try again.'`
     - `'substitute'` → `'Could not find substitutions. Please try again.'`
     - `'nutrition'` → `'Could not estimate nutrition. Please try again.'`
     - `'generate-image'` → `'Could not generate image. Please try again.'`
     - Default → `'AI service is temporarily unavailable. Please try again.'`

**Patterns to follow**:

- Pure utility functions with JSDoc documentation
- Use generic types for `withAIRetry` to preserve type safety

---

### Section 4: AI Validation Schemas (`src/lib/validations/ai.ts`)

**What to do**: Create Zod schemas for AI request validation.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 406-408) — Generator input
- `docs/ROADMAP.md` (lines 787-788) — Generator body spec

**Specific requirements**:

1. **`recipeGenerateSchema`**: Validates the recipe generation request body
   - `ingredients`: array of strings, min 1 item, max 20 items, each string min 1 char, max 100 chars
   - `cuisine`: string, optional, max 50 chars
   - `dietary`: string, optional, max 50 chars
   - `difficulty`: enum (EASY, MEDIUM, HARD), optional
   - `servings`: positive integer, min 1, max 20, optional

2. **`ingredientSubstituteSchema`**: For task-9.2 (define now for co-location)
   - `ingredient`: string, min 1 char, max 100 chars
   - `recipeContext`: string, optional, max 500 chars
   - `dietaryRestrictions`: string, optional, max 200 chars

3. **`nutritionEstimateSchema`**: For task-9.2 (define now for co-location)
   - No body needed — uses recipe ID from URL params

4. **`imageGenerateSchema`**: For task-9.3 (define now for co-location)
   - `recipeTitle`: string, min 1, max 200
   - `description`: string, optional, max 500

5. Export inferred types for all schemas

**Patterns to follow**:

- Follow `src/lib/validations/recipe.ts` — Zod schemas with custom error messages

---

### Section 5: AI Types (`src/types/ai.ts`)

**What to do**: Create TypeScript types for AI response structures.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 419-430) — AI response format
- `docs/ROADMAP.md` (line 787) — Structured JSON output

**Specific requirements**:

1. **`AIGeneratedRecipe`**: The structured JSON output from recipe generation
   - `name`: string
   - `description`: string
   - `prepTime`: number
   - `cookTime`: number
   - `servings`: number
   - `difficulty`: `'EASY' | 'MEDIUM' | 'HARD'`
   - `cuisineType`: string
   - `ingredients`: `{ name: string; quantity: string; notes?: string }[]`
   - `steps`: `{ instruction: string; duration?: number }[]`
   - `dietaryTags`: `string[]`

2. **`AISubstitution`**: For task-9.2
   - `name`: string
   - `ratio`: string (e.g., "1:1")
   - `notes`: string

3. **`AINutritionEstimate`**: For task-9.2
   - `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`: all numbers (per serving)

4. **`RateLimitInfo`**: Rate limit metadata
   - `remaining`: number
   - `resetAt`: string (ISO date)

**Patterns to follow**:

- Follow `src/types/recipe.ts` — interfaces for API response shapes

---

### Section 6: Recipe Generation API Route (`src/app/api/ai/generate/route.ts`)

**What to do**: Create the streaming recipe generation endpoint using Vercel AI SDK.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 403-440) — Generator implementation spec
- `docs/CTO_SPECS.md` (line 581) — `POST /api/ai/generate`
- `docs/ROADMAP.md` (lines 784-788) — Generator endpoint spec

**Specific requirements**:

1. **POST** `/api/ai/generate`:
   - Require authentication via `requireAuth()`
   - Check rate limit via `checkRateLimit(generateRateLimiter, userId)` — return 429 if exceeded
   - Validate body against `recipeGenerateSchema` — return 400 if invalid
   - Use Vercel AI SDK `streamText()` with `openai('gpt-4o-mini')` model
   - **System prompt** (per `docs/SENIOR_DEVELOPER.md` lines 418-430):
     - Instruct the model to act as a professional chef
     - Request structured JSON output matching `AIGeneratedRecipe` format
     - Include recipe name, description, ingredients with quantities, steps with optional durations, prep/cook times, servings, difficulty, cuisine type, dietary tags
   - **User prompt**: Include available ingredients, optional cuisine/dietary/difficulty/servings preferences
   - Return streaming response via `result.toDataStreamResponse()`
   - Wrap the AI call with `withAIRetry()` for the non-streaming setup (note: streaming itself handles errors differently — use try/catch around `streamText` initialization)

2. **Error handling**:
   - If `streamText` initialization fails, return 503 with user-friendly message
   - Never expose OpenAI error details in response

**Patterns to follow**:

- Use `streamText` from `ai` package (Vercel AI SDK)
- Use `openai()` model provider from `@ai-sdk/openai`
- Follow auth pattern from existing API routes

---

### Section 7: Recipe Generator UI (`src/components/ai/recipe-generator.tsx`)

**What to do**: Create the interactive recipe generator component.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 442-448) — Generator UI spec
- `docs/ROADMAP.md` (lines 788-791) — Generator component spec

**Specific requirements**:

1. **Ingredient Input**:
   - Chip/tag input: user types an ingredient name and presses Enter to add
   - Display added ingredients as removable chips/badges
   - Minimum 1 ingredient required to generate
   - Maximum 20 ingredients
   - Clear all button

2. **Preference Selectors** (optional):
   - Cuisine type: text input or select with common options
   - Dietary preference: select (vegan, vegetarian, gluten-free, etc.)
   - Difficulty: select (Easy, Medium, Hard)
   - Servings: number input (1-20)

3. **Generate Button**:
   - Disabled when no ingredients added
   - Shows loading/generating state during streaming
   - "Generate Recipe" label with sparkle/AI icon

4. **Streaming Output Area**:
   - Display the generated recipe as text streams in
   - Use `useChat()` or `useCompletion()` from Vercel AI SDK's React hooks
   - Once complete, parse the JSON output into `AIGeneratedRecipe` structure
   - Display formatted recipe: name, description, ingredients list, steps list, metadata

5. **"Save as New Recipe" Button**:
   - Visible after generation completes
   - Creates a real recipe via `POST /api/recipes` using the parsed AI output
   - Pre-fills all form data and creates the recipe directly (skipping the wizard)
   - Sets visibility to PRIVATE by default
   - On success: navigate to the new recipe detail page

6. **Error Handling**:
   - Show toast on generation failure
   - Show rate limit message if 429
   - Allow retry

**Patterns to follow**:

- `'use client'` component
- Use Vercel AI SDK React hooks for streaming
- Use shadcn/ui components: Badge, Button, Input, Select, Card
- Use toast notifications for feedback

---

### Section 8: Generator Page (`src/app/(main)/ai/generate/page.tsx`)

**What to do**: Create the "What's in your fridge?" page.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 442-448) — Generator page spec

**Specific requirements**:

1. **Route**: `/ai/generate` (protected, already in middleware via `/ai/*` prefix)
2. **Content**:
   - Page title: "AI Recipe Generator" or "What's in your fridge?"
   - Subtitle explaining the feature
   - Recipe generator component (from Section 7)
3. **Metadata**: Page title and description for SEO

**Patterns to follow**:

- Follow `src/app/(main)/my-recipes/page.tsx` — simple page component pattern

---

### Section 9: AI React Hooks (`src/hooks/use-ai.ts`)

**What to do**: Create React hooks for AI features.

**Where to find context**:

- `src/hooks/use-recipes.ts` — Pattern for hooks
- Vercel AI SDK documentation for `useChat` / `useCompletion`

**Specific requirements**:

1. **`useSaveAIRecipe()`** — Mutation hook to save an AI-generated recipe
   - Calls `POST /api/recipes` with the parsed `AIGeneratedRecipe` data mapped to `RecipeFormData`
   - On success: invalidate recipe list queries, toast success, return the new recipe ID
   - On error: toast error

2. Note: The streaming hook itself is `useCompletion()` from `ai/react` (Vercel AI SDK), used directly in the recipe-generator component — no custom wrapper needed.

**Patterns to follow**:

- Follow `src/hooks/use-recipes.ts` — co-located fetchers, mutation callbacks

---

### Section 10: Tests

**What to do**: Write tests for all AI infrastructure and the recipe generator.

**Where to find context**:

- `src/app/api/recipes/__tests__/route.test.ts` — API route test pattern
- `src/lib/validations/__tests__/recipe.test.ts` — Validation test pattern

**Specific requirements**:

**Rate Limiter Tests** (`src/lib/__tests__/rate-limit.test.ts`):

- Allows requests under the limit
- Blocks requests at the limit
- Returns correct `remaining` count
- Returns correct `resetAt` time
- Sliding window expires old requests
- Different identifiers tracked independently
- `checkRateLimit` returns null when allowed, 429 response when exceeded

**AI Utilities Tests** (`src/lib/__tests__/ai-utils.test.ts`):

- `withAIRetry`: succeeds on first call → returns result
- `withAIRetry`: fails once, succeeds on retry → returns result
- `withAIRetry`: fails twice → throws with formatted message
- `withAIRetry`: logs errors on failure
- `formatAIError`: returns correct message for each action
- `formatAIError`: returns default for unknown action

**Validation Tests** (`src/lib/validations/__tests__/ai.test.ts`):

- `recipeGenerateSchema`: valid input accepted, empty ingredients rejected, too many ingredients rejected, invalid difficulty rejected
- Other schemas validate correctly

**API Route Tests** (`src/app/api/ai/generate/__tests__/route.test.ts`):

- POST with valid data → returns streaming response
- POST with empty ingredients → 400
- POST unauthenticated → 401
- POST rate limited → 429 with appropriate headers
- POST with OpenAI failure → 503 with user-friendly message (mock `streamText`)

**Generator Component Tests** (`src/components/ai/__tests__/recipe-generator.test.tsx`):

- Renders ingredient input and preference selectors
- Generate button disabled when no ingredients
- Adds and removes ingredient chips
- Shows loading state during generation
- Displays generated recipe after streaming completes
- "Save as New Recipe" button visible after generation

**Patterns to follow**:

- **Mock OpenAI**: Use `vi.mock('ai')` to mock `streamText`; never make real API calls
- **Mock rate limiter**: Test rate limiter in isolation with controllable time
- Co-located `__tests__/` directory pattern

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests still pass

### Functional Verification

- [ ] OpenAI client initializes with API key from environment
- [ ] Rate limiter correctly limits to configured max per window
- [ ] Rate limiter returns 429 with remaining/reset headers when exceeded
- [ ] `withAIRetry` retries once on failure and throws formatted error on second failure
- [ ] `formatAIError` returns correct user-friendly messages
- [ ] POST `/api/ai/generate` requires authentication (401 without)
- [ ] POST `/api/ai/generate` validates ingredients (400 if empty)
- [ ] POST `/api/ai/generate` checks rate limit (429 if exceeded)
- [ ] POST `/api/ai/generate` returns streaming response with recipe data
- [ ] Recipe generator UI allows adding/removing ingredient chips
- [ ] Recipe generator UI shows streaming output during generation
- [ ] "Save as New Recipe" creates a real recipe from AI output
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration (model names, rate limits exported as constants)
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] OpenAI error details never exposed to users
- [ ] Rate limiter is deterministic and testable
- [ ] AI prompts are clear and produce structured JSON output

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

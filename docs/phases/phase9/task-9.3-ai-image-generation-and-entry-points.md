---
task_id: 'task-9.3'
title: 'AI Image Generation & Entry Points'
phase: 9
task_number: 3
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-9.1'
  - 'task-9.2'
  - 'task-8.4'
blocks: []
created_at: '2026-02-21'
---

# AI Image Generation & Entry Points

## Current State

> The AI infrastructure (OpenAI client, rate limiter, retry utility) and the two must-have AI features (recipe generation, substitution, nutrition) are complete from tasks 9.1 and 9.2. The `ImageSource.AI_GENERATED` enum, `RecipeImage` model, and `dalleRateLimiter` exist. The recipe form images step has a placeholder for AI image generation. The `imageGenerateSchema` validation schema was pre-defined in task-9.1. The recipe detail page now has all social features integrated (task-8.4). However, no DALL-E image generation API route exists, no AI entry points (quick-access buttons) are placed throughout the app, and the nice-to-have features (smart tagging, meal planning) have not been started.

- **What exists**:
  - OpenAI client singleton (`src/lib/openai.ts`) with `IMAGE_MODEL = 'dall-e-3'`
  - `dalleRateLimiter` (10/hr) (`src/lib/rate-limit.ts`)
  - `withAIRetry()` and `formatAIError('generate-image')` (`src/lib/ai-utils.ts`)
  - `imageGenerateSchema` validation (`src/lib/validations/ai.ts`)
  - `ImageSource.AI_GENERATED` enum value (`prisma/schema.prisma`)
  - `RecipeImage` model with `source` field (`prisma/schema.prisma`)
  - Recipe form images step with placeholder for AI generation (`src/components/recipes/recipe-form/images-step.tsx`)
  - Recipe detail page with social features integrated (task-8.4)
  - Substitution dialog component (`src/components/ai/substitution-dialog.tsx`)
  - Nutrition display component (`src/components/ai/nutrition-display.tsx`)
  - Cloudinary configuration (`src/lib/cloudinary.ts`)
  - Dashboard page (`src/app/(main)/dashboard/page.tsx`)
  - Header component (`src/components/layout/header.tsx`)
- **What is missing**:
  - `src/app/api/ai/generate-image/[recipeId]/route.ts` — DALL-E image generation endpoint
  - AI "Generate Image" button in recipe form images step (wiring the placeholder)
  - AI entry points throughout the app (dashboard, header, recipe detail)
  - Integration of substitution button into ingredient list on recipe detail
  - Integration of nutrition display into recipe detail (replacing placeholder)
  - Nice-to-have: `src/app/api/ai/suggest-tags/route.ts` — Smart tag suggestions
  - Nice-to-have: `src/app/api/ai/meal-plan/route.ts` — Meal plan generation
  - Tests for all of the above
- **Relevant code**:
  - `src/lib/openai.ts` — OpenAI client with IMAGE_MODEL constant
  - `src/lib/rate-limit.ts` — dalleRateLimiter
  - `src/lib/cloudinary.ts` — Cloudinary upload helpers
  - `src/components/recipes/recipe-form/images-step.tsx` — Where AI generate button goes
  - `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — Where substitution buttons go
  - `src/components/recipes/recipe-detail/nutrition-section.tsx` — Where nutrition display goes
  - `src/app/(main)/dashboard/page.tsx` — Where "Generate Recipe" quick action goes
  - `src/components/layout/header.tsx` — Where AI generate shortcut goes
  - `docs/CTO_SPECS.md` (lines 186-197) — Image strategy
  - `docs/CTO_SPECS.md` (line 586) — `POST /api/ai/generate-image/[recipeId]`
  - `docs/SENIOR_DEVELOPER.md` (lines 490-508) — DALL-E implementation

---

## Desired Outcome

- **End state**: Users can generate AI food photography images for their recipes using DALL-E 3, accessible from both the recipe form and recipe detail page. All AI features have natural entry points throughout the app (dashboard quick actions, header shortcuts, recipe detail inline buttons). The substitution button is wired into the ingredient list, and the nutrition display replaces the placeholder on recipe detail. Optionally, nice-to-have AI features (smart tagging, meal planning) are implemented if time permits.
- **User-facing changes**:
  - "Generate Image with AI" button in recipe form images step
  - "Generate Image" button on recipe detail page (for recipe owner)
  - "Substitute" buttons next to each ingredient on recipe detail
  - Nutrition display card on recipe detail (replacing placeholder)
  - "AI Generate" quick action on dashboard
  - Optional: Smart tag suggestions during recipe creation
  - Optional: Meal plan generator page
- **Developer-facing changes**:
  - `src/app/api/ai/generate-image/[recipeId]/route.ts` — DALL-E endpoint
  - Updated `src/components/recipes/recipe-form/images-step.tsx` — AI generate button wired
  - Updated `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — Substitution buttons
  - Updated `src/components/recipes/recipe-detail/nutrition-section.tsx` — Nutrition display
  - Updated `src/app/(main)/dashboard/page.tsx` — AI quick actions
  - Updated `src/components/layout/header.tsx` — AI shortcut
  - Optional: `src/app/api/ai/suggest-tags/route.ts`
  - Optional: `src/app/api/ai/meal-plan/route.ts` + `src/components/ai/meal-planner.tsx`
  - Tests for all of the above

---

## Scope & Boundaries

### In Scope

- Create DALL-E image generation API route
- Wire "Generate Image with AI" into recipe form images step
- Add "Generate Image" button on recipe detail page (owner only)
- Wire substitution dialog trigger buttons into recipe ingredient list
- Replace nutrition section placeholder with the real nutrition display component
- Add "AI Generate Recipe" quick action on dashboard
- Add AI shortcut in header navigation
- Write tests for DALL-E endpoint and integration points
- Nice-to-have (if time permits): Smart tag suggestion API and UI
- Nice-to-have (if time permits): Meal plan generation API and UI

### Out of Scope

- AI infrastructure (client, rate limiter, retry) — task-9.1
- Substitution and nutrition API routes and components — task-9.2
- Recipe form wizard itself — task-5.2
- Recipe detail page layout — task-8.4
- Performance optimization of AI features — Phase 12
- Cloudinary upload widget — already exists

### Dependencies

- AI infrastructure complete (task-9.1)
- Substitution and nutrition features complete (task-9.2)
- Recipe detail page with social integration (task-8.4)
- Recipe form images step exists (task-5.2 — done)
- Cloudinary configuration exists (done)

---

## Implementation Details

### Section 1: DALL-E Image Generation API Route (`src/app/api/ai/generate-image/[recipeId]/route.ts`)

**What to do**: Create POST endpoint for AI food image generation.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 490-508) — DALL-E spec
- `docs/CTO_SPECS.md` (line 586) — `POST /api/ai/generate-image/[recipeId]`
- `docs/CTO_SPECS.md` (lines 186-197) — Image strategy

**Specific requirements**:

1. **POST** `/api/ai/generate-image/:recipeId`:
   - Require authentication via `requireAuth()`
   - Require recipe ownership via `requireRecipeOwner()` (only owner can generate images for their recipe)
   - Check rate limit via `checkRateLimit(dalleRateLimiter, userId)` — 10/hour
   - Fetch recipe details (name, description) for prompt context
   - **Build DALL-E prompt**: `"A professional food photography shot of [recipe name], [description], appetizing, well-plated, natural lighting, high resolution, top-down angle"` (per `docs/SENIOR_DEVELOPER.md` line 497)
   - Call OpenAI `images.generate()` with:
     - `model: 'dall-e-3'`
     - `prompt`: the constructed prompt
     - `size: '1024x1024'`
     - `quality: 'standard'`
     - `n: 1`
   - Wrap with `withAIRetry(fn, 'generate-image')`
   - Get the generated image URL from the response
   - **Store in database**: Create a `RecipeImage` record with:
     - `recipeId`: the recipe ID
     - `url`: the generated image URL
     - `source: 'AI_GENERATED'`
     - `isPrimary`: set to `true` only if no other images exist for this recipe
     - `order`: set to the next available order number
   - Return the created `RecipeImage` record with URL

2. **Error handling**:
   - If DALL-E fails → 503 with "Could not generate image. Please try again."
   - If rate limited → 429
   - Never expose OpenAI error details

**Patterns to follow**:

- Use OpenAI client directly (not Vercel AI SDK — DALL-E is not a text model)
- Follow auth + ownership + rate limit pattern

---

### Section 2: Wire AI Image Generation into Recipe Form

**What to do**: Connect the "Generate Image with AI" button in the recipe form images step.

**Where to find context**:

- `src/components/recipes/recipe-form/images-step.tsx` — Existing images step with placeholder
- `docs/SENIOR_DEVELOPER.md` (lines 503-508) — Image generation UI

**Specific requirements**:

1. Add "Generate with AI" button/section alongside existing upload and URL options
2. **For new recipes** (not yet saved): Disable AI generation with tooltip "Save the recipe first to generate an AI image" — DALL-E endpoint needs a `recipeId`
3. **For existing recipes** (edit mode):
   - "Generate Image with AI" button with sparkle icon
   - Click → call DALL-E endpoint with recipe ID
   - Loading state with progress indicator ("Generating image...")
   - Preview of generated image with confirm/discard options
   - On confirm: image is already saved server-side, refresh image list
   - "Regenerate" button to try again
4. Maximum image limit: If recipe already has 5 images, disable AI generation

**Patterns to follow**:

- Use existing patterns from images-step.tsx
- Add mutation via `use-ai.ts` hook

---

### Section 3: Wire Substitution into Recipe Ingredients

**What to do**: Add substitution trigger buttons next to each ingredient on the recipe detail page.

**Where to find context**:

- `src/components/recipes/recipe-detail/recipe-ingredients.tsx` — Ingredient list component
- `src/components/ai/substitution-dialog.tsx` — Substitution dialog from task-9.2

**Specific requirements**:

1. Next to each ingredient in the ingredient list, add a small "Substitute" button (swap/arrow icon)
2. Click opens the `SubstitutionDialog` component with the ingredient name and recipe context
3. Only show for authenticated users (not guests)
4. Recipe context: pass the list of other ingredients so the AI can provide contextually relevant substitutions

**Patterns to follow**:

- Minimal change to existing component
- Import and render `SubstitutionDialog` inline

---

### Section 4: Replace Nutrition Section Placeholder

**What to do**: Replace the existing nutrition section placeholder with the real nutrition display component.

**Where to find context**:

- `src/components/recipes/recipe-detail/nutrition-section.tsx` — Existing placeholder
- `src/components/ai/nutrition-display.tsx` — New component from task-9.2

**Specific requirements**:

1. Replace the placeholder content in `nutrition-section.tsx` with the `NutritionDisplay` component
2. Pass the recipe's cached `nutritionData`, `recipeId`, and `isOwner` flag
3. The component handles both states: data exists (display) and data is null (estimate button)

**Patterns to follow**:

- Minimal change — swap the placeholder content for the real component

---

### Section 5: Add AI Entry Points Throughout App

**What to do**: Add AI feature access points in the dashboard, header, and recipe detail.

**Where to find context**:

- `docs/ROADMAP.md` (lines 821-825) — AI entry points spec
- `src/app/(main)/dashboard/page.tsx` — Dashboard page
- `src/components/layout/header.tsx` — Header component

**Specific requirements**:

1. **Dashboard** (`src/app/(main)/dashboard/page.tsx`):
   - Add "AI Generate Recipe" quick action button/card in the quick actions section
   - Link to `/ai/generate`
   - Use sparkle/AI icon for visual distinction

2. **Header** (`src/components/layout/header.tsx`):
   - Add "AI Generate" link or icon in the navigation
   - Consider adding it as part of the "Add Recipe" dropdown or as a standalone link
   - Visible only for authenticated users

3. **Recipe Detail Page** (already partially done in task-8.4):
   - "Generate Image" button in the image section (for recipe owner) — link to edit page or inline
   - "Substitute" buttons are wired in Section 3
   - "Estimate Nutrition" is wired in Section 4

**Patterns to follow**:

- Minimal additions to existing components
- Use consistent AI iconography (sparkle icon from lucide-react)

---

### Section 6: AI Hooks Additions (`src/hooks/use-ai.ts`)

**What to do**: Add image generation hook to the existing AI hooks file.

**Where to find context**:

- `src/hooks/use-ai.ts` — Existing hooks from tasks 9.1 and 9.2

**Specific requirements**:

1. **`useGenerateImage()`** — Mutation hook for DALL-E image generation
   - Calls `POST /api/ai/generate-image/:recipeId`
   - On success: invalidate `['recipe', recipeId]` to refresh recipe images, toast success
   - On error: toast with user-friendly message
   - Return the generated `RecipeImage` data

**Patterns to follow**:

- Follow existing mutation patterns in `src/hooks/use-ai.ts`

---

### Section 7: Nice-to-Have — Smart Tag Suggestions (if time permits)

**What to do**: Create an API route for AI-suggested tags during recipe creation.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 510-514) — Smart tagging spec
- `docs/CTO_SPECS.md` (line 584) — `POST /api/ai/suggest-tags`

**Specific requirements** (only implement if time permits):

1. **POST** `/api/ai/suggest-tags`:
   - Require authentication
   - Input: `{ name: string; ingredients: string[] }`
   - Use GPT-4o-mini to suggest: cuisine type, dietary tags, difficulty
   - Return: `{ cuisineType: string; dietaryTags: string[]; difficulty: string }`
2. UI: Suggestion pills in the recipe form that user can accept/dismiss
3. Rate limit: Use generate rate limiter (20/hr)

---

### Section 8: Nice-to-Have — Meal Plan Generator (if time permits)

**What to do**: Create a meal plan generation feature.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` (lines 516-520) — Meal plan spec
- `docs/CTO_SPECS.md` (line 585) — `POST /api/ai/meal-plan`

**Specific requirements** (only implement if time permits):

1. **POST** `/api/ai/meal-plan`:
   - Require authentication
   - Input: `{ days: number; dietaryPreferences?: string; recipeIds?: string[] }`
   - Use streaming (`streamText`) for longer responses
   - Return a 7-day meal plan with breakfast/lunch/dinner slots
2. UI: `src/components/ai/meal-planner.tsx` — Weekly calendar grid
3. Page: `src/app/(main)/ai/meal-plan/page.tsx`
4. Rate limit: Use generate rate limiter

---

### Section 9: Tests

**What to do**: Write tests for DALL-E endpoint, integration points, and optionally nice-to-have features.

**Where to find context**:

- `src/app/api/ai/generate/__tests__/route.test.ts` — AI route test pattern
- `src/app/api/ai/substitute/__tests__/route.test.ts` — AI route test pattern

**Specific requirements**:

**DALL-E API Tests** (`src/app/api/ai/generate-image/[recipeId]/__tests__/route.test.ts`):

- POST creates image and stores in database
- POST requires auth → 401
- POST requires recipe ownership → 403
- POST rate limited → 429
- POST handles DALL-E failure → 503
- Generated image stored with `source: AI_GENERATED`
- Sets `isPrimary: true` if first image on recipe

**Integration Tests**:

- Recipe form images step shows "Generate with AI" button in edit mode
- Recipe ingredients show substitution buttons for authenticated users
- Nutrition section displays data when cached, shows estimate button when not
- Dashboard shows AI generate quick action
- Header shows AI navigation link

**Nice-to-Have Tests** (if implemented):

- Smart tagging returns cuisine, dietary, difficulty suggestions
- Meal plan returns structured 7-day plan

**Patterns to follow**:

- Mock OpenAI `images.generate()` — never make real API calls
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

- [ ] POST `/api/ai/generate-image/:recipeId` generates an image and stores it in the database
- [ ] Generated image has `source: AI_GENERATED` and correct recipe association
- [ ] DALL-E endpoint requires auth and recipe ownership
- [ ] DALL-E rate limit enforced (10/hour)
- [ ] Recipe form images step has functional "Generate with AI" button (edit mode)
- [ ] Recipe ingredients have substitution buttons that open the dialog
- [ ] Recipe detail shows nutrition display with data or estimate button
- [ ] Dashboard has "AI Generate Recipe" quick action linking to `/ai/generate`
- [ ] Header has AI navigation link
- [ ] All AI error states show user-friendly messages
- [ ] All new tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] OpenAI error details never exposed to users
- [ ] DALL-E prompt produces appetizing food photography descriptions
- [ ] AI entry points are visually consistent (same icon/style)

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

# Execution Plan: Phases 8 & 9 — Sharing, Social Features, Guest Access & AI Features

## Context

Phases 1–7 are complete (auth, recipe CRUD, tagging, collections, search & discovery). The database schema already includes all models needed for phases 8–9 (RecipeShare, ShareLink, Rating, Comment, etc.). The middleware already protects `/shared-with-me` and `/ai/*` routes, and allows public access to `/community` and `/recipes/share/[token]`.

This plan implements all 7 tasks across Phase 8 (Sharing, Social & Guest Access) and Phase 9 (AI Features), following the task execution skill and all code generation skills.

---

## Task 8.1 — Sharing & Visibility System

**Files to create:**

- [src/lib/validations/sharing.ts](src/lib/validations/sharing.ts)
- [src/app/api/recipes/[id]/visibility/route.ts](src/app/api/recipes/[id]/visibility/route.ts)
- [src/app/api/recipes/[id]/shares/route.ts](src/app/api/recipes/[id]/shares/route.ts)
- [src/app/api/users/search/route.ts](src/app/api/users/search/route.ts)
- [src/app/api/recipes/[id]/share-link/route.ts](src/app/api/recipes/[id]/share-link/route.ts)
- [src/hooks/use-sharing.ts](src/hooks/use-sharing.ts)
- [src/components/social/share-dialog.tsx](src/components/social/share-dialog.tsx)
- Tests: `__tests__/route.test.ts` for each API route

**Files to modify:**

- [src/test/factories.ts](src/test/factories.ts) — add `createMockRecipeShare`, `createMockShareLink`

### Steps

1. **Validation schemas** (`src/lib/validations/sharing.ts`) — `updateVisibilitySchema` (z.nativeEnum(Visibility)), `shareByUsernameSchema` (username string), `userSearchSchema` (q string min 1), inferred types

2. **PUT `/api/recipes/[id]/visibility`** — `requireRecipeOwner()` guard, safeParse body, `prisma.recipe.update({ visibility })`, return `{ id, visibility }`

3. **GET/POST/DELETE `/api/recipes/[id]/shares`**
   - GET: owner guard, query RecipeShare with user select (id, name, username, image — no email)
   - POST: owner guard, validate username, lookup user by username, 404 if not found, 400 if self, create RecipeShare (handle 409 duplicate via Prisma unique constraint catch), auto-upgrade visibility PRIVATE→SHARED
   - DELETE: owner guard, validate username, lookup user, deleteMany RecipeShare

4. **GET `/api/users/search`** — `requireAuth()`, parse `q` from searchParams, `prisma.user.findMany` with `username startsWith` (insensitive), exclude self, select id/name/username/image only (no email), take 10

5. **POST/DELETE `/api/recipes/[id]/share-link`**
   - POST: owner guard, generate token via `nanoid(21)`, create ShareLink, auto-upgrade visibility PRIVATE→SHARED, return `{ token, id }`
   - DELETE: owner guard, parse `linkId` from body, set `isActive: false`

6. **Sharing hooks** (`src/hooks/use-sharing.ts`) — follow use-tags.ts pattern: fetcher functions above hooks, query keys `['recipe-shares', recipeId]`, `['user-search', query]`. Hooks: `useRecipeShares`, `useShareRecipe`, `useRevokeShare`, `useUpdateVisibility`, `useCreateShareLink`, `useRevokeShareLink`, `useSearchUsers` (enabled when query.length >= 1)

7. **Share dialog** (`src/components/social/share-dialog.tsx`) — `'use client'`, Dialog with visibility selector at top + Tabs ("Share with Users" / "Share Link"). User tab: debounced search input, autocomplete dropdown, current shares list with Remove. Link tab: Generate/Copy/Revoke buttons. Props: `{ recipeId, recipeName, currentVisibility }`

8. **Test factories** — add `createMockRecipeShare`, `createMockShareLink` to factories.ts

9. **Tests** — for each route: auth/ownership guard, validation, success path, edge cases (share with self 400, duplicate 409, no email leak in user search)

10. **Verify** — `npm run build` + `npm test`

---

## Task 8.2 — Ratings & Comments

**Files to create:**

- [src/lib/validations/social.ts](src/lib/validations/social.ts)
- [src/app/api/recipes/[id]/ratings/route.ts](src/app/api/recipes/[id]/ratings/route.ts)
- [src/app/api/recipes/[id]/comments/route.ts](src/app/api/recipes/[id]/comments/route.ts)
- [src/app/api/comments/[id]/route.ts](src/app/api/comments/[id]/route.ts)
- [src/hooks/use-ratings.ts](src/hooks/use-ratings.ts)
- [src/hooks/use-comments.ts](src/hooks/use-comments.ts)
- [src/components/social/star-rating.tsx](src/components/social/star-rating.tsx)
- [src/components/social/comment-section.tsx](src/components/social/comment-section.tsx)
- Tests for each API route + validation schemas

**Files to modify:**

- [src/test/factories.ts](src/test/factories.ts) — add `createMockRating`, `createMockComment`

### Steps

11. **Social validation schemas** (`src/lib/validations/social.ts`) — `ratingValueSchema` (int 1-5), `createRatingSchema`, `createCommentSchema` (1-1000 chars trimmed), `updateCommentSchema`, inferred types

12. **GET/POST `/api/recipes/[id]/ratings`**
    - GET: No auth required. Return recipe's `avgRating`, `ratingCount`. If authenticated, also return user's own rating via `prisma.rating.findUnique({ where: { userId_recipeId } })`
    - POST: `requireAuth()`, safeParse body, verify recipe exists + user has view access, 403 if rating own recipe (`authorId === userId`), upsert Rating, recalculate avgRating/ratingCount via `prisma.rating.aggregate`, update recipe, return updated stats

13. **GET/POST `/api/recipes/[id]/comments`**
    - GET: Pagination from searchParams (page, limit). Query comments ordered by `createdAt desc`, select id/content/createdAt/updatedAt + user (id/name/username/image — no email). Return paginated response
    - POST: `requireAuth()`, safeParse body, verify recipe access, sanitize content (strip HTML tags via regex `/<[^>]*>/g`), create Comment, return 201

14. **PUT/DELETE `/api/comments/[id]`**
    - PUT: `requireAuth()`, fetch comment, 403 if not comment author, safeParse body, update comment
    - DELETE: `requireAuth()`, fetch comment with recipe relation, allow if user is comment author OR recipe author, delete comment

15. **Rating hooks** (`src/hooks/use-ratings.ts`) — `useRecipeRating(recipeId)` query, `useRateRecipe()` mutation with optimistic update of rating display, invalidate `['recipe-rating', recipeId]` and `['recipes']`

16. **Comment hooks** (`src/hooks/use-comments.ts`) — `useComments(recipeId, page)` query, `useCreateComment()`, `useUpdateComment()`, `useDeleteComment()` mutations with toast notifications, invalidate `['comments', recipeId]`

17. **Star rating component** (`src/components/social/star-rating.tsx`) — `'use client'`, 5 Star icons from lucide-react. Interactive mode: hover preview + click to rate with optimistic update. Read-only mode: average display only. Props: `{ recipeId, initialAvgRating, initialRatingCount, initialUserRating, isOwner, isAuthenticated, readOnly? }`

18. **Comment section** (`src/components/social/comment-section.tsx`) — `'use client'`, comment form (textarea with char count max 1000), paginated comment list (avatar, username, time-ago, content), edit/delete controls (own comments or recipe author can delete), empty state, "Load more" pagination. Props: `{ recipeId, recipeAuthorId, currentUserId? }`

19. **Test factories + tests** — add mock factories, test all routes for auth, validation, business logic (cannot rate own, upsert behavior, avgRating recalculation, ownership for edit/delete, XSS sanitization)

20. **Verify** — `npm run build` + `npm test`

---

## Task 8.3 — Community Page & Guest Access

**Files to create:**

- [src/app/api/recipes/public/route.ts](src/app/api/recipes/public/route.ts)
- [src/app/api/recipes/shared-with-me/route.ts](src/app/api/recipes/shared-with-me/route.ts)
- [src/app/api/share/[token]/route.ts](src/app/api/share/[token]/route.ts)
- [src/components/shared/login-prompt.tsx](src/components/shared/login-prompt.tsx)
- [src/app/community/page.tsx](src/app/community/page.tsx)
- [src/app/community/layout.tsx](src/app/community/layout.tsx)
- [src/app/(main)/community/page.tsx](<src/app/(main)/community/page.tsx>)
- [src/app/(main)/shared-with-me/page.tsx](<src/app/(main)/shared-with-me/page.tsx>)
- [src/app/recipes/share/[token]/page.tsx](src/app/recipes/share/[token]/page.tsx)
- Tests for each API route

### Steps

21. **GET `/api/recipes/public`** — No auth required. Summary-only select: `id, name, description, prepTime, cookTime, servings, difficulty, cuisineType, avgRating, ratingCount, createdAt, author(id/name/username/image), images(primary only)`. No ingredients, steps, comments, nutrition, or email. Sort options: newest, rating. Paginated

22. **GET `/api/recipes/shared-with-me`** — `requireAuth()`. Query `prisma.recipeShare.findMany` for current user, include recipe with summary select + `sharedAt`. Paginated, sorted by sharedAt desc

23. **GET `/api/share/[token]`** — No auth required. Lookup ShareLink by token, 404 if not found or inactive. If authenticated: return full recipe detail. If guest: return summary-only fields + `isAuthenticated: false` flag

24. **Login prompt** (`src/components/shared/login-prompt.tsx`) — Two variants: `overlay` (blurred overlay with CTA) and `inline` (card with message + sign-in button). Props: `{ message?, variant? }`. Links to `/login`

25. **Public community page** (`src/app/community/page.tsx` + `layout.tsx`) — Public route (outside `(main)`). Layout shares Header + Footer. Server component fetching PUBLIC recipes with summary select. Recipe grid with summary cards, sort dropdown (Newest, Top Rated), pagination. "Sign in to see full recipes" CTA

26. **Authenticated community page** (`src/app/(main)/community/page.tsx`) — Within `(main)` layout. Full recipe cards, sort (Newest, Top Rated, Most Commented), filter panel (reuse search filter components), link to shared-with-me

27. **Shared-with-me page** (`src/app/(main)/shared-with-me/page.tsx`) — Fetch shared recipes. Show who shared + when (sharedAt). Recipe grid with full cards. Empty state

28. **Share link access page** (`src/app/recipes/share/[token]/page.tsx`) — Public route. Server component. Valid token + authenticated → full recipe. Valid token + guest → summary + LoginPrompt overlay. Invalid/inactive token → not-found

29. **Middleware verification** — `/community` already allowed (not in protectedRoutes). `/recipes/share/[token]` already allowed. `/shared-with-me` already protected. No changes needed

30. **Tests** — public route returns only PUBLIC recipes with summary fields, shared-with-me requires auth, share token access guest vs authenticated response

31. **Verify** — `npm run build` + `npm test`

---

## Task 8.4 — Social Integration into Recipe Detail

**Files to modify:**

- [src/components/recipes/recipe-detail/recipe-actions.tsx](src/components/recipes/recipe-detail/recipe-actions.tsx) — add Share button (owner only)
- [src/app/(main)/recipes/[id]/page.tsx](<src/app/(main)/recipes/[id]/page.tsx>) — wire StarRating + CommentSection + share

### Steps

32. **Update recipe-actions.tsx** — Import ShareDialog. Add `currentVisibility` prop. Add Share button (Share2 icon) for owners that opens ShareDialog. Place after Edit/Delete buttons, before Duplicate

33. **Update recipe detail page** — Add to the parallel Promise.all: fetch user's own rating (`prisma.rating.findUnique`). Import + render `StarRating` between title/description and metadata. Import + render `CommentSection` after NutritionSection. Pass `currentVisibility` to RecipeActions. Conditional rendering: owner (all controls, no self-rating), viewer (rate + comment + tag + save), guest (read-only rating, login prompt for comments)

34. **Verify** — `npm run build` + `npm test`. Manual flow: view as owner → view as non-owner → rate → comment → share

---

## Task 9.1 — AI Infrastructure & Recipe Generator

**Files to create:**

- [src/lib/openai.ts](src/lib/openai.ts)
- [src/lib/rate-limit.ts](src/lib/rate-limit.ts)
- [src/lib/ai-utils.ts](src/lib/ai-utils.ts)
- [src/lib/validations/ai.ts](src/lib/validations/ai.ts)
- [src/types/ai.ts](src/types/ai.ts)
- [src/app/api/ai/generate/route.ts](src/app/api/ai/generate/route.ts)
- [src/hooks/use-ai.ts](src/hooks/use-ai.ts)
- [src/components/ai/recipe-generator.tsx](src/components/ai/recipe-generator.tsx)
- [src/app/(main)/ai/generate/page.tsx](<src/app/(main)/ai/generate/page.tsx>)
- Tests for rate-limit, ai-utils, validation schemas, generate route

### Steps

35. **OpenAI client** (`src/lib/openai.ts`) — Use `createOpenAI` from `@ai-sdk/openai` (already installed). globalThis singleton. Export `openai` provider + constants `GPT_MODEL = 'gpt-4o-mini'`, `DALLE_MODEL = 'dall-e-3'`

36. **Rate limiter** (`src/lib/rate-limit.ts`) — In-memory sliding window via `Map<string, number[]>` (array of timestamps). globalThis cached. Factory: `createRateLimiter({ windowMs, maxRequests })`. Method: `check(userId)` returns `{ allowed, remaining, resetAt }`. Pre-configured exports: `generationLimiter` (20/hr), `substitutionLimiter` (50/hr), `nutritionLimiter` (30/hr), `imageLimiter` (10/hr). Helper: `checkRateLimit(limiter, userId)` returns 429 NextResponse or null

37. **AI utilities** (`src/lib/ai-utils.ts`) — `withAIRetry(fn)`: try → catch+retry → catch+throw. `formatAIError(action)`: user-friendly message. JSDoc on all exports

38. **AI validation schemas** (`src/lib/validations/ai.ts`) — `generateRecipeSchema`: ingredients (1-20 strings), optional cuisine/dietary/difficulty/servings. `substituteIngredientSchema`: ingredient (1-100), optional recipeContext/dietaryRestrictions. `generateImageSchema`: recipeId. Inferred types

39. **AI types** (`src/types/ai.ts`) — `AIGeneratedRecipe`, `AISubstitution`, `AISubstitutionResponse`, `AINutritionData`, `AIRateLimitInfo`

40. **POST `/api/ai/generate`** — `requireAuth()`, rate limit check, safeParse body. Use `streamText()` from `ai` package with `openai('gpt-4o-mini')`. System prompt: professional chef, return JSON matching AIGeneratedRecipe schema. Return `result.toDataStreamResponse()`. Error handling with `formatAIError`

41. **AI hooks** (`src/hooks/use-ai.ts`) — `useRecipeGenerator()` wrapping `useChat` from `ai/react` with `/api/ai/generate` endpoint. `useSaveAIRecipe()` mutation to POST `/api/recipes` with parsed AI output

42. **Recipe generator component** (`src/components/ai/recipe-generator.tsx`) — `'use client'`. Ingredient chip input (Enter to add, X to remove, min 1, max 20). Optional preference selectors (cuisine combobox, dietary multi-select, difficulty select, servings number). Generate button. Streaming output display. "Save as New Recipe" button (creates recipe via useSaveAIRecipe, PRIVATE visibility, navigates to new recipe). Rate limit display. Error handling with retry

43. **Generator page** (`src/app/(main)/ai/generate/page.tsx`) — Metadata: "AI Recipe Generator". Heading "What's in your fridge?". Render RecipeGenerator component

44. **Tests** — rate limiter (allows/rejects correctly, per-user isolation, resets), withAIRetry (succeed/retry/fail), validation schemas, generate route (auth 401, rate limit 429, valid request, invalid body 400). Mock `ai` module's `streamText`

45. **Verify** — `npm run build` + `npm test`

---

## Task 9.2 — Ingredient Substitution & Nutritional Estimates

**Files to create:**

- [src/app/api/ai/substitute/route.ts](src/app/api/ai/substitute/route.ts)
- [src/app/api/ai/nutrition/[recipeId]/route.ts](src/app/api/ai/nutrition/[recipeId]/route.ts)
- [src/components/ai/substitution-dialog.tsx](src/components/ai/substitution-dialog.tsx)
- [src/components/ai/nutrition-display.tsx](src/components/ai/nutrition-display.tsx)
- Tests for each API route

**Files to modify:**

- [src/hooks/use-ai.ts](src/hooks/use-ai.ts) — add substitution/nutrition hooks
- [src/app/api/recipes/[id]/route.ts](src/app/api/recipes/[id]/route.ts) — clear nutritionData on ingredient update

### Steps

46. **POST `/api/ai/substitute`** — `requireAuth()`, rate limit (50/hr), safeParse body. Use `generateText()` from `ai` (not streaming). System prompt: culinary expert, return JSON `{ substitutions: [{ name, ratio, notes }] }`, 2-3 suggestions. Wrap in `withAIRetry`. Return 200

47. **POST `/api/ai/nutrition/[recipeId]`** — `requireAuth()`, rate limit (30/hr, only when AI call needed). Verify recipe exists + user has view access. If `recipe.nutritionData` exists → return cached data immediately (no AI call, no rate limit check). If not cached: fetch ingredients with quantities, build prompt, use `generateText()`, parse JSON, cache result via `prisma.recipe.update({ nutritionData: result })`, return 200

48. **Clear nutrition cache** — Modify `PUT /api/recipes/[id]/route.ts`: in the ingredients update block (around line ~186), add `nutritionData: Prisma.DbNull` (or `null`) to the recipe update when ingredients change

49. **Substitution dialog** (`src/components/ai/substitution-dialog.tsx`) — `'use client'`. Trigger: small button with `ArrowRightLeft` icon. Dialog shows ingredient name, loading state, 2-3 substitution cards (name, ratio, notes). Error state with retry. AI disclaimer. Props: `{ ingredientName, recipeContext? }`

50. **Nutrition display** (`src/components/ai/nutrition-display.tsx`) — `'use client'`. If data exists: nutrition facts card (reuse NUTRITION_FIELDS from existing NutritionSection). If no data: "Estimate Nutrition" button (Sparkles icon). "Refresh" button for owner (re-estimates). Loading state. AI disclaimer. Props: `{ recipeId, initialNutritionData, isOwner }`

51. **Extend use-ai.ts** — Add: `useSubstitution()` mutation, `useNutritionEstimate(recipeId)` query (initialData from server), `useEstimateNutrition()` mutation (invalidates recipe cache on success)

52. **Tests** — substitution route (auth, rate limit, valid/invalid, structured response), nutrition route (auth, rate limit, cache hit returns immediately, cache miss calls AI, caches result), nutrition cache cleared on ingredient update

53. **Verify** — `npm run build` + `npm test`

---

## Task 9.3 — AI Image Generation & Entry Points

**Files to create:**

- [src/app/api/ai/generate-image/[recipeId]/route.ts](src/app/api/ai/generate-image/[recipeId]/route.ts)
- Tests for the route

**Files to modify:**

- [src/lib/cloudinary.ts](src/lib/cloudinary.ts) — add server-side upload function
- [src/components/recipes/recipe-form/images-step.tsx](src/components/recipes/recipe-form/images-step.tsx) — enable AI Generate button
- [src/components/recipes/recipe-detail/recipe-ingredients.tsx](src/components/recipes/recipe-detail/recipe-ingredients.tsx) — add substitution buttons
- [src/app/(main)/recipes/[id]/page.tsx](<src/app/(main)/recipes/[id]/page.tsx>) — replace NutritionSection with NutritionDisplay
- [src/app/(main)/dashboard/page.tsx](<src/app/(main)/dashboard/page.tsx>) — add AI Generate quick action
- [src/components/layout/header.tsx](src/components/layout/header.tsx) — add AI Generate nav item
- [src/hooks/use-ai.ts](src/hooks/use-ai.ts) — add image generation hook

### Steps

54. **Server-side Cloudinary upload** — Add `uploadImageFromUrl(url: string)` to `src/lib/cloudinary.ts`. Use Cloudinary's upload API via fetch with signature (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME). Returns Cloudinary URL

55. **POST `/api/ai/generate-image/[recipeId]`** — `requireRecipeOwner()`, rate limit (10/hr). Fetch recipe name + description. Build DALL-E prompt: "Professional food photography of {name}, {description}, appetizing, well-plated, natural lighting, top-down angle". Call OpenAI `images.generate()` via the OpenAI SDK directly (not AI SDK — DALL-E is not supported by Vercel AI SDK). Upload result URL to Cloudinary. Create RecipeImage with `source: 'AI_GENERATED'`, set `isPrimary` if first image. Wrap in `withAIRetry`. Return `{ url, imageId }` with 201

56. **Wire AI into images-step.tsx** — Remove disabled state + "Coming soon" tooltip from AI Generate button (lines 122-132 of current file). Add: if in edit mode (recipeId exists), clicking calls `useGenerateImage()` mutation; if in create mode, show tooltip "Save recipe first to generate AI images". Show loading spinner during generation. On success, append image to form's images array

57. **Wire substitution into recipe-ingredients.tsx** — Import SubstitutionDialog. Add a small button (ArrowRightLeft icon) next to each ingredient's notes. Only show when `isAuthenticated` prop is true. Pass ingredient name and recipe context. Add `isAuthenticated` to `RecipeIngredientsProps` and pass from recipe detail page

58. **Replace NutritionSection** — In recipe detail page, replace `<NutritionSection nutritionData={recipe.nutritionData} />` with `<NutritionDisplay recipeId={recipe.id} initialNutritionData={recipe.nutritionData} isOwner={isOwner} />`

59. **Dashboard AI entry point** — Add "AI Generate Recipe" button to Quick Actions section in dashboard. Sparkles icon, link to `/ai/generate`

60. **Header AI entry point** — Add `{ label: 'AI Generate', href: '/ai/generate', icon: Sparkles }` to `DESKTOP_NAV_ITEMS` array (after Community, before Shopping Lists)

61. **Extend use-ai.ts** — Add `useGenerateImage()` mutation, on success invalidate `['recipe', recipeId]`, toast success

62. **Tests** — generate-image route (auth 401, rate limit 429, ownership 403, valid request 201). Mock OpenAI images.generate and Cloudinary upload

63. **Verify** — `npm run build` + `npm test`

---

## Execution Order Summary

| Step  | Task | What                                  |
| ----- | ---- | ------------------------------------- |
| 1–10  | 8.1  | Sharing & Visibility System           |
| 11–20 | 8.2  | Ratings & Comments                    |
| 21–31 | 8.3  | Community Page & Guest Access         |
| 32–34 | 8.4  | Social Integration into Recipe Detail |
| 35–45 | 9.1  | AI Infrastructure & Recipe Generator  |
| 46–53 | 9.2  | Ingredient Substitution & Nutrition   |
| 54–63 | 9.3  | AI Image Generation & Entry Points    |

**Total: ~50 new files, ~10 modified files**

Each task ends with `npm run build` + `npm test` verification, and a git commit following `task-<phase>.<number>: <brief description>` convention.

## Verification

After all tasks complete:

1. Build passes: `npm run build`
2. All tests pass: `npm test`
3. Manual flow: Create recipe → set PUBLIC → rate → comment → share by username → share by link → view as guest → view community → AI generate recipe → save AI recipe → substitution → nutrition estimate → AI image generation

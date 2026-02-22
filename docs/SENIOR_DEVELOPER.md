# Recipe Management System - Senior Developer Specs

> **Status:** LOCKED — All decisions finalized across PM, CTO, and Senior Dev. Ready for implementation.

---

## Dependencies Summary

All upstream decisions are locked:

- **PM:** Three-tier visibility, social features (ratings/comments), OpenAI, DALL-E on-demand, share-by-username + share-by-link, multi-tag support, "Shared with me" notifications, guest summary-only access, Pinterest card layout, mobile-first, 15-20 seed recipes
- **CTO:** Next.js 14+ / Prisma / Neon PostgreSQL / NextAuth.js v5 / OpenAI GPT-4o-mini + DALL-E 3 / Cloudinary / Vercel / Vercel AI SDK
- **Senior Dev (this doc):** Usernames locked (alphanumeric + underscores, 3-20 chars, case-sensitive, not changeable), multi-step wizard form, dashboard landing page, silent retry AI errors, shopping lists persisted in DB

---

## Implementation Plan (Phased)

### Phase 1: Project Scaffolding & Auth (Foundation)

**Goal:** Bootable app with authentication, username setup, and base layout.
**Estimated scope:** ~15 files

1. Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
   ```
2. Install core dependencies:

   ```bash
   # UI
   npx shadcn-ui@latest init
   npm install @tanstack/react-query react-hook-form @hookform/resolvers zod

   # Database
   npm install prisma @prisma/client @neondatabase/serverless
   npx prisma init

   # Auth
   npm install next-auth@beta @auth/prisma-adapter

   # AI
   npm install ai openai

   # Image upload
   npm install next-cloudinary
   ```

3. Set up Prisma with Neon PostgreSQL connection (serverless driver)
4. Define **full database schema** from CTO specs (all models, enums, indexes)
5. Run initial migration: `npx prisma migrate dev --name init`
6. Configure NextAuth.js v5 with:
   - Google OAuth provider
   - GitHub OAuth provider
   - Prisma adapter (auto-manages User, Account, Session tables)
   - JWT session strategy
   - Username capture on first login (redirect to `/onboarding` if no username set)
   - Username rules: alphanumeric + underscores only, 3-20 chars, case-sensitive, **not changeable** after set
7. Create root layout with providers:
   - `QueryClientProvider` (React Query)
   - `SessionProvider` (NextAuth)
   - `ThemeProvider` (shadcn/ui dark mode)
8. Create base layout components:
   - `Header` — logo, nav links, auth state (login/avatar), dark mode toggle
   - `Navigation` — responsive sidebar/navbar: My Recipes, Community, AI Tools, My Collection, Shopping Lists
   - `Footer` — minimal
9. Create pages:
   - `/` — **landing page for guests** (hero section, featured public recipes, CTA to sign up) / **dashboard for authenticated users** (quick stats: recipe count, favorites count, recent activity; recent recipes grid; quick action buttons: Add Recipe, Browse Community, AI Generate)
   - `/onboarding` — username setup form (shown after first OAuth login, validates: alphanumeric + underscores, 3-20 chars, unique check via API, **locked permanently after set**)
   - `/login` — sign-in page with Google + GitHub buttons
10. Seed database with:
    - System user "RecipeApp" for seed recipes
    - 2-3 test user accounts
    - Seed dietary tags: vegan, vegetarian, gluten-free, dairy-free, nut-free, keto, paleo

**Deliverable:** App boots, user can log in via Google/GitHub, set username, see empty dashboard.

---

### Phase 2: Recipe CRUD + Images

**Goal:** Full recipe management with all three image sources.
**Estimated scope:** ~25 files

#### 2a. API Routes

Build all recipe CRUD endpoints per CTO API contract:

| Route File                                    | Endpoints                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `src/app/api/recipes/route.ts`                | `GET` (list my recipes w/ pagination, search, filters), `POST` (create) |
| `src/app/api/recipes/[id]/route.ts`           | `GET` (detail), `PUT` (update), `DELETE` (delete)                       |
| `src/app/api/recipes/[id]/summary/route.ts`   | `GET` (public summary, no auth)                                         |
| `src/app/api/recipes/[id]/duplicate/route.ts` | `POST` (fork recipe)                                                    |
| `src/app/api/upload/image/route.ts`           | `POST` (Cloudinary signed upload signature)                             |

**Authorization middleware pattern:**

```typescript
// src/lib/auth-helpers.ts
async function requireAuth(request: Request): Promise<Session>;
async function requireRecipeOwner(
  recipeId: string,
  userId: string
): Promise<Recipe>;
```

**Recipe creation flow:**

1. Validate request body with Zod schema
2. Create `Recipe` record
3. Upsert `Ingredient` records (find-or-create by normalized name)
4. Create `RecipeIngredient` join records with quantities and order
5. Create `RecipeStep` records with step numbers
6. Create `RecipeDietaryTag` join records
7. Create `RecipeImage` records (if provided)
8. Return full recipe with all relations

#### 2b. UI Pages

**Recipe form — Multi-Step Wizard** (`/recipes/new` and `/recipes/[id]/edit`):

A guided 5-step wizard with progress indicator and back/next navigation:

```
Step 1: Basic Info → Step 2: Ingredients → Step 3: Steps → Step 4: Tags → Step 5: Images → Review & Submit
```

- **Step 1 — Basic Info:** name (required), description, prep time, cook time, servings, difficulty (select), cuisine type (select/combobox)
- **Step 2 — Ingredients:** dynamic list using `useFieldArray`
  - Each row: ingredient name (autocomplete from existing), quantity, unit, notes
  - Add/remove/reorder rows
  - Minimum 1 ingredient required to proceed
- **Step 3 — Steps:** ordered instruction list using `useFieldArray`
  - Each row: step number (auto), instruction (textarea), optional timer (minutes)
  - Add/remove/reorder with drag or up/down buttons
  - Minimum 1 step required to proceed
- **Step 4 — Tags:** dietary tag selection (multi-select chips from DietaryTag table)
- **Step 5 — Images:**
  - Cloudinary upload widget (drag-and-drop or click to upload)
  - URL input field (paste external URL)
  - "Generate Image with AI" button (calls DALL-E 3, see Phase 6)
  - Image preview grid, set primary image, reorder, delete
- **Review screen:** summary of all entered data before final submit
- **Wizard state management:** use React Hook Form's `useForm` with a single form instance across all steps; validate per-step with Zod schemas; persist draft in localStorage to prevent data loss on accidental navigation
- **Edit mode:** pre-populates all steps from existing recipe data; allows jumping to any step via the progress indicator

**Recipe list** (`/recipes`):

- Pinterest-style masonry grid using CSS Grid
- `RecipeCard` component showing: primary image, title, prep+cook time, difficulty badge, cuisine tag, average rating (stars)
- Infinite scroll or pagination
- Empty state: "No recipes yet — add your first recipe!"

**Recipe detail** (`/recipes/[id]`):

- Hero section: primary image (full width), title, author, ratings summary
- Metadata bar: prep time, cook time, servings, difficulty, cuisine
- Ingredients list with quantities
- Step-by-step instructions (numbered)
- Dietary tag chips
- Action buttons: Edit, Delete, Duplicate (owner only)
- Tag buttons: Favorite (heart), To Try (bookmark), Made Before (check) — shown for all auth users
- Social section: ratings, comments (Phase 5)
- Nutrition card (Phase 6)

**Deliverable:** Full recipe CRUD with images, Pinterest grid, recipe detail page.

---

### Phase 3: Status Tagging & Collections

**Goal:** Personal status tags with multi-tag support + saved recipes.
**Estimated scope:** ~10 files

#### 3a. API Routes

| Route File                                       | Endpoints                                         |
| ------------------------------------------------ | ------------------------------------------------- |
| `src/app/api/recipes/[id]/tag/route.ts`          | `POST` (add tag — body: `{ status }`)             |
| `src/app/api/recipes/[id]/tag/[status]/route.ts` | `DELETE` (remove specific tag)                    |
| `src/app/api/recipes/[id]/save/route.ts`         | `POST` (save to collection), `DELETE` (unsave)    |
| `src/app/api/me/collection/route.ts`             | `GET` (my recipes + saved + tagged, with filters) |

**Multi-tag behavior:**

- `POST /api/recipes/[id]/tag` with `{ status: "FAVORITE" }` — adds FAVORITE tag
- Same recipe can also have TO_TRY and MADE_BEFORE tags simultaneously
- `DELETE /api/recipes/[id]/tag/FAVORITE` — removes only FAVORITE, others remain
- Unique constraint `@@unique([userId, recipeId, status])` prevents duplicate same-status tags

#### 3b. UI Components

**Tag toggle buttons** (`TagButtons` component):

- Three toggle buttons per recipe: Heart (favorite), Bookmark (to try), Check (made before)
- Each independently toggleable (not mutually exclusive)
- Optimistic updates via React Query `useMutation` + `onMutate` for instant feedback
- Shown on recipe cards (compact) and recipe detail page (full size with labels)

**My Collection page** (`/my-collection`):

- Tab bar: All | Favorites | To Try | Made Before | Saved
- Each tab filters the collection accordingly
- "All" shows everything: my authored recipes + saved community recipes + any tagged recipes
- Pinterest grid layout (reuses `RecipeCard`)
- Empty states per tab

**Deliverable:** Users can tag recipes with multiple statuses, view filtered collections.

---

### Phase 4: Search & Discovery

**Goal:** Full-text search + filters across recipes.
**Estimated scope:** ~8 files

#### 4a. PostgreSQL Full-Text Search Setup

Add a Prisma migration for full-text search:

```sql
-- Add tsvector column to Recipe
ALTER TABLE "Recipe" ADD COLUMN "searchVector" tsvector;

-- Create GIN index
CREATE INDEX recipe_search_idx ON "Recipe" USING GIN("searchVector");

-- Create trigger to auto-update searchVector
CREATE OR REPLACE FUNCTION update_recipe_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."cuisineType", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_search_update
  BEFORE INSERT OR UPDATE ON "Recipe"
  FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();
```

For ingredient search, use a subquery joining through `RecipeIngredient` → `Ingredient`.

#### 4b. Search API

`GET /api/recipes` query parameters:
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search across name, description, cuisine, ingredients |
| `cuisine` | string | Filter by cuisine type |
| `dietary` | string[] | Filter by dietary tags (comma-separated) |
| `difficulty` | enum | Filter by difficulty |
| `maxPrepTime` | number | Max prep time in minutes |
| `maxCookTime` | number | Max cook time in minutes |
| `status` | enum | Filter by user tag status |
| `sort` | string | `name`, `createdAt`, `prepTime`, `rating` |
| `order` | string | `asc`, `desc` |
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20, max 50) |

#### 4c. Search UI

**Search bar** — prominent, always visible in header or top of recipe pages:

- Debounced input (300ms) using `useDeferredValue` or custom debounce hook
- Search-as-you-type with React Query

**Filter panel** — sidebar on desktop, slide-out drawer on mobile:

- Cuisine type: multi-select dropdown (populated from DB)
- Dietary tags: checkbox group
- Difficulty: radio buttons (Easy / Medium / Hard / Any)
- Prep time: range slider (0-120 min)
- Cook time: range slider (0-180 min)
- Rating: minimum star rating filter
- Sort by: dropdown

**URL-driven filters** — all filter state synced to URL search params for shareable/bookmarkable searches.

**Deliverable:** Full-text search, multi-filter, sorted results across all recipes.

---

### Phase 5: Sharing, Social & Guest Access

**Goal:** Three-tier visibility, share-by-username, share links, ratings, comments, guest access.
**Estimated scope:** ~25 files

#### 5a. Three-Tier Visibility + Sharing API

| Route File                                              | Endpoints                                                 |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `src/app/api/recipes/[id]/visibility/route.ts`          | `PUT` (set PRIVATE/SHARED/PUBLIC)                         |
| `src/app/api/recipes/[id]/share/route.ts`               | `POST` (share with user by username), `GET` (list shares) |
| `src/app/api/recipes/[id]/share/[userId]/route.ts`      | `DELETE` (revoke share)                                   |
| `src/app/api/recipes/[id]/share-link/route.ts`          | `POST` (generate link)                                    |
| `src/app/api/recipes/[id]/share-link/[linkId]/route.ts` | `DELETE` (revoke link)                                    |
| `src/app/api/share/[token]/route.ts`                    | `GET` (access via share link)                             |
| `src/app/api/users/search/route.ts`                     | `GET` (search by username for share dialog)               |
| `src/app/api/recipes/public/route.ts`                   | `GET` (browse public, no auth required)                   |
| `src/app/api/recipes/shared-with-me/route.ts`           | `GET` (recipes shared with me)                            |

**Share dialog component:**

- Modal triggered by "Share" button on recipe detail
- Visibility selector: Private / Shared / Public (radio or segmented control)
- When "Shared" or "Public" selected:
  - Username search input with autocomplete (debounced, calls `/api/users/search`)
  - List of current shares with "Revoke" button per user
  - "Copy Share Link" button → generates `ShareLink` token, copies URL to clipboard
  - List of active share links with "Revoke" button per link

#### 5b. Ratings & Comments API

| Route File                                   | Endpoints                                         |
| -------------------------------------------- | ------------------------------------------------- |
| `src/app/api/recipes/[id]/rating/route.ts`   | `POST` (upsert 1-5 rating)                        |
| `src/app/api/recipes/[id]/comments/route.ts` | `GET` (list), `POST` (add comment)                |
| `src/app/api/comments/[id]/route.ts`         | `PUT` (edit own), `DELETE` (own or recipe author) |

**Rating logic:**

```typescript
// On rating upsert:
// 1. Upsert Rating record
// 2. Recalculate avgRating: SELECT AVG(value) FROM Rating WHERE recipeId = ?
// 3. Update Recipe.avgRating and Recipe.ratingCount
```

**Rating UI:**

- Star rating component (1-5, clickable stars)
- Show current user's rating + average rating
- Optimistic update on click

**Comments UI:**

- Flat comment list below recipe detail
- Comment card: avatar, username, timestamp, content, edit/delete buttons
- "Add comment" form: textarea + submit
- Recipe author sees delete button on all comments
- Comment authors see edit + delete on their own

#### 5c. Guest Access

**Public pages (no auth required):**

- `/` — landing page with featured public recipes (summary cards)
- `/community` — browse all public recipes (summary cards)
- `/share/[token]` — share link page (summary for guest, full for auth)

**Summary card (guest view):**

- Shows: image, title, prep time, cuisine, difficulty, average rating
- Click → login prompt modal: "Log in to see the full recipe"
- No tag buttons, no comments, no ingredients/steps visible

**Middleware approach:**

```typescript
// src/middleware.ts
// Protected routes: /recipes/new, /recipes/*/edit, /my-collection, /ai/*
// Semi-protected: /recipes/[id] (redirects guests to login)
// Public: /, /community, /share/[token], /api/recipes/public, /api/recipes/[id]/summary
```

#### 5d. Community Page

`/community` page:

- Pinterest grid of all public recipes (summary view for guests, full cards for auth)
- Search bar + filters (reuse search components from Phase 4)
- "Shared with me" tab: recipes specifically shared with the current user
- "Save to Collection" button on each card

**Deliverable:** Full sharing system, ratings, comments, guest browsing, community page.

---

### Phase 6: AI Features

**Goal:** Must-have AI features (generator, substitution, nutrition) + on-demand DALL-E image generation.
**Estimated scope:** ~15 files

#### 6a. OpenAI Integration Setup

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

```typescript
// src/lib/ai-rate-limit.ts
// Simple in-memory rate limiter per user
// Limits: 20/hr generation, 50/hr substitution, 10/hr DALL-E
// Uses Map<userId, { count, resetAt }>
```

**AI Error Handling — Silent Retry + Fallback (Locked):**

```typescript
// src/lib/ai-error-handler.ts
// Pattern used across ALL AI endpoints:
// 1. Attempt the AI call
// 2. On failure → silent retry once (same request)
// 3. On second failure → return generic user-friendly message
//    - "Could not generate recipe. Please try again."
//    - "Could not estimate nutrition. Please try again."
//    - "Could not generate image. Please try again."
// 4. Never expose internal errors, rate limit details, or OpenAI error codes to the user
// 5. Log detailed errors server-side for debugging (console.error with context)

async function withAIRetry<T>(
  fn: () => Promise<T>,
  fallbackMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (firstError) {
    console.error('AI call failed, retrying:', firstError);
    try {
      return await fn();
    } catch (secondError) {
      console.error('AI retry failed:', secondError);
      throw new ApiError(503, fallbackMessage);
    }
  }
}
```

#### 6b. AI Recipe Generator (Must-have)

**Endpoint:** `POST /api/ai/generate`
**Input:** `{ ingredients: string[], preferences?: { cuisine?, dietary?, difficulty? } }`
**Pattern:** Streaming via Vercel AI SDK

```typescript
// src/app/api/ai/generate/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { ingredients, preferences } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a professional chef. Generate a complete recipe using the provided ingredients.
Return the recipe in this exact JSON format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "EASY|MEDIUM|HARD",
  "cuisineType": "Italian",
  "ingredients": [{ "name": "...", "quantity": "...", "notes": "..." }],
  "steps": [{ "instruction": "...", "duration": 5 }],
  "dietaryTags": ["vegan", "gluten-free"]
}`,
    prompt: `Ingredients available: ${ingredients.join(', ')}
${preferences?.cuisine ? `Preferred cuisine: ${preferences.cuisine}` : ''}
${preferences?.dietary ? `Dietary requirements: ${preferences.dietary}` : ''}`,
  });

  return result.toDataStreamResponse();
}
```

**UI: "What's in your fridge?" page** (`/ai/generate`):

- Ingredient input: chip/tag input where user types ingredient names and presses Enter
- Optional preference selectors: cuisine, dietary, difficulty
- "Generate Recipe" button
- Streaming output area: recipe appears as it's generated
- "Save this recipe" button → creates a real recipe from the AI output
- Recent generations list (stored in local state or localStorage)

#### 6c. Ingredient Substitution (Must-have)

**Endpoint:** `POST /api/ai/substitute`
**Input:** `{ recipeId: string, ingredientName: string, context: string }`
**Pattern:** Request-response (not streaming — responses are short)

```typescript
// Prompt includes the full recipe context for accurate substitutions
system: `You are a culinary expert. Suggest 2-3 ingredient substitutions.
Consider the recipe context, flavor profile, and cooking method.
Return JSON: { "substitutions": [{ "name": "...", "ratio": "...", "notes": "..." }] }`;
```

**UI:** "Substitute" button next to each ingredient on recipe detail page:

- Click → popover/modal showing AI substitution suggestions
- Each suggestion shows: ingredient name, ratio (e.g., "1:1"), notes
- Loading state while AI processes

#### 6d. AI Nutritional Estimates (Must-have)

**Endpoint:** `POST /api/ai/nutrition/[recipeId]`
**Pattern:** Request-response, **cached** in `Recipe.nutritionData` JSON field

```typescript
// Check cache first
const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
if (recipe.nutritionData) return Response.json(recipe.nutritionData);

// If not cached, call AI
// Prompt includes all ingredients with quantities
// Returns: { calories, protein, carbs, fat, fiber, sugar, sodium } per serving
// Cache result: await prisma.recipe.update({ where: { id }, data: { nutritionData: result } })
```

**UI:** Nutrition card on recipe detail page:

- Compact card below ingredients showing: calories, protein, carbs, fat per serving
- "Estimate Nutrition" button (if not yet calculated)
- Disclaimer: "AI-estimated values. Actual nutrition may vary."
- Invalidate cache when recipe ingredients are edited

#### 6e. On-Demand DALL-E Image Generation

**Endpoint:** `POST /api/ai/generate-image/[recipeId]`
**Pattern:** Async request, stores URL in `RecipeImage` table

```typescript
// 1. Get recipe details for prompt context
// 2. Generate prompt: "A professional food photography shot of [recipe name], [description], appetizing, well-plated, natural lighting"
// 3. Call openai.images.generate({ model: 'dall-e-3', prompt, size: '1024x1024', quality: 'standard' })
// 4. Store resulting URL in RecipeImage with source: AI_GENERATED
// 5. Return the image URL
```

**UI:** "Generate Image" button in recipe edit form and recipe detail page:

- Button with sparkle/AI icon
- Loading state with progress indicator
- Preview of generated image
- Confirm to save or regenerate

#### 6f. Nice-to-Have AI Features (if time permits)

**Smart Tagging** (`POST /api/ai/suggest-tags`):

- Called during recipe creation after user fills in name + ingredients
- Returns suggested: cuisine type, dietary tags, difficulty
- UI: suggestion pills that user can accept/dismiss

**Meal Plan** (`POST /api/ai/meal-plan`):

- Input: user's recipe collection + dietary preferences + days
- Returns: 7-day plan with breakfast/lunch/dinner slots
- UI: weekly calendar grid with recipe cards in slots

**Deliverable:** All three must-have AI features working, DALL-E image generation on-demand.

---

### Phase 7: Extra Features & Polish

**Goal:** Creative features, responsive design, dark mode.
**Estimated scope:** ~15 files

#### 7a. Recipe Scaling

- Scaling UI: servings adjuster (increment/decrement buttons) on recipe detail
- Logic: `newQuantity = originalQuantity * (newServings / originalServings)`
- Parse quantity strings: "2 cups" → `{ value: 2, unit: "cups" }` → scale → "4 cups"
- Handle fractions: "1/2 cup" → "1 cup" when doubled
- Client-side only — no API call needed

#### 7b. Shopping List Generator (Database-Persisted)

**Data model (added to Prisma schema):**

```prisma
model ShoppingList {
  id        String             @id @default(cuid())
  name      String             // "Shopping list for week of Feb 17"
  user      User               @relation(fields: [userId], references: [id])
  userId    String
  items     ShoppingListItem[]
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  @@index([userId])
}

model ShoppingListItem {
  id             String       @id @default(cuid())
  shoppingList   ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  shoppingListId String
  ingredientName String
  quantity       String?      // aggregated quantity
  category       String?      // "produce", "dairy", "pantry", etc.
  checked        Boolean      @default(false)
  order          Int          @default(0)
}
```

**API Routes:**
| Route File | Endpoints |
|-----------|-----------|
| `src/app/api/me/shopping-lists/route.ts` | `GET` (list my shopping lists), `POST` (create from selected recipes) |
| `src/app/api/me/shopping-lists/[id]/route.ts` | `GET` (detail), `PUT` (update), `DELETE` (delete) |
| `src/app/api/me/shopping-lists/[id]/items/[itemId]/route.ts` | `PUT` (toggle checked, edit) |

**UI flow:**

- Checkbox selection on "My Collection" page to select recipes
- "Generate Shopping List" button → aggregates all ingredients across selected recipes
- Combine duplicates: "2 cups flour" + "1 cup flour" = "3 cups flour"
- Categorize by type (produce, dairy, pantry, etc.) — use static mapping
- Shopping list page: checklist UI with checkboxes per item, grouped by category
- Export options: copy to clipboard, print
- Persisted in database — accessible across devices, survives browser clears
- "My Shopping Lists" page showing saved lists with dates

#### 7c. Cooking Timer

- Timer component on recipe detail page, tied to steps with `duration` field
- Start/pause/reset controls
- Audio alert when timer completes
- Multiple simultaneous timers (one per step)
- Persist across tab switches using `requestAnimationFrame` or Web Workers

#### 7d. Step-by-Step Cooking Mode (Mobile)

- Full-screen overlay on recipe detail
- One step at a time, large text
- Swipe left/right or next/prev buttons to navigate steps
- Timer integration per step
- Keep screen awake using Wake Lock API

#### 7e. Dark Mode

- shadcn/ui `ThemeProvider` with system/light/dark options
- Toggle in header
- Persist preference in localStorage
- All components already support dark mode via Tailwind `dark:` classes

#### 7f. Print-Friendly View

- CSS `@media print` styles
- Hide navigation, sidebar, buttons
- Clean recipe layout: title, metadata, ingredients, steps
- Trigger via "Print" button on recipe detail

#### 7g. Responsive Design Pass

- Mobile-first breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Recipe grid: 1 column (mobile) → 2 columns (tablet) → 3-4 columns (desktop)
- Collapsible sidebar filters on mobile (drawer pattern)
- Touch-friendly: minimum 44px tap targets on buttons
- Bottom navigation bar on mobile (recipes, community, AI, collection, profile)

**Deliverable:** Scaling, shopping list, timers, dark mode, print, full responsive.

---

### Phase 8: Seed Data

**Goal:** 15-20 pre-loaded recipes for a populated-feeling app.
**Estimated scope:** ~2 files

```typescript
// prisma/seed.ts
// 1. Create system user "RecipeApp" (or use a fixed ID)
// 2. Create dietary tags
// 3. Create 15-20 diverse recipes:
//    - 3-4 Italian (pasta, risotto, pizza, tiramisu)
//    - 3-4 Asian (stir-fry, sushi, pad thai, curry)
//    - 2-3 Mexican (tacos, enchiladas, guacamole)
//    - 2-3 Middle Eastern (hummus, falafel, shawarma)
//    - 2-3 American (burger, BBQ, mac & cheese)
//    - 2-3 assorted (salad, soup, dessert)
// 4. Each recipe includes:
//    - Full ingredient list with quantities
//    - 4-8 step-by-step instructions with timers
//    - Real image URLs (from Unsplash or Pexels, food-specific)
//    - Appropriate dietary tags
//    - Varied difficulty levels
// 5. All seed recipes: visibility = PUBLIC, author = "RecipeApp"
// 6. Add some pre-calculated nutrition data for demo
```

Run with: `npx prisma db seed`

**Deliverable:** Seeded database with diverse, realistic recipes.

---

### Phase 9: Deployment & Ship

**Goal:** Production deployment on Vercel.
**Estimated scope:** ~5 files (config + README)

1. **Neon database:**
   - Create production database on Neon
   - Run migrations: `npx prisma migrate deploy`
   - Run seed: `npx prisma db seed`

2. **Vercel setup:**
   - Connect GitHub repo to Vercel
   - Set environment variables (see CTO specs `.env` template)
   - Configure build command: `prisma generate && next build`
   - Set Node.js version: 18+

3. **OAuth setup:**
   - Register Google OAuth app with production callback URL
   - Register GitHub OAuth app with production callback URL
   - Update `NEXTAUTH_URL` to production domain

4. **OpenAI:**
   - Set `OPENAI_API_KEY` in Vercel environment variables
   - Verify rate limiting works in production

5. **Cloudinary:**
   - Set cloud name, API key, API secret in Vercel env vars
   - Configure upload preset for production

6. **End-to-end testing:**
   - Sign up flow (Google + GitHub OAuth)
   - Username onboarding
   - Recipe CRUD (create, edit, delete)
   - Image upload (Cloudinary) + URL + DALL-E generation
   - Tagging (multi-tag)
   - Sharing (by username, by link, visibility toggle)
   - Guest access (summary only, login prompt)
   - AI features (generate, substitute, nutrition)
   - Search + filters
   - Ratings + comments
   - Shopping lists (create from recipes, check items, persist across sessions)
   - Recipe scaling
   - Mobile responsiveness
   - Dark mode

7. **README.md:**
   - Project description
   - Live demo link
   - Tech stack overview
   - Local development setup instructions
   - Environment variables reference
   - Available AI features
   - Screenshots

**Deliverable:** Live app at `*.vercel.app`, README, GitHub repo ready for submission.

---

## File Structure (Finalized)

```
RecipeManagementSystem/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Landing / dashboard
│   │   ├── globals.css                   # Tailwind + global styles
│   │   │
│   │   ├── (auth)/                       # Auth route group
│   │   │   ├── login/page.tsx            # Sign-in page
│   │   │   └── onboarding/page.tsx       # Username setup (first login)
│   │   │
│   │   ├── recipes/                      # Recipe pages
│   │   │   ├── page.tsx                  # My recipes grid
│   │   │   ├── new/page.tsx              # Create recipe form
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx              # Recipe detail
│   │   │   │   └── edit/page.tsx         # Edit recipe form
│   │   │   └── share/
│   │   │       └── [token]/page.tsx      # Share link access page
│   │   │
│   │   ├── community/page.tsx            # Public recipes + shared with me
│   │   ├── my-collection/page.tsx        # Tagged/saved recipes with tabs
│   │   ├── shopping-lists/
│   │   │   ├── page.tsx                  # My shopping lists
│   │   │   └── [id]/page.tsx             # Shopping list detail (checklist)
│   │   │
│   │   ├── ai/                           # AI feature pages
│   │   │   ├── generate/page.tsx         # "What's in your fridge?"
│   │   │   └── meal-plan/page.tsx        # Weekly meal planner (nice-to-have)
│   │   │
│   │   ├── profile/
│   │   │   └── [username]/page.tsx       # User profile (public recipes)
│   │   │
│   │   └── api/                          # API Route Handlers
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── recipes/
│   │       │   ├── route.ts              # GET (list), POST (create)
│   │       │   ├── public/route.ts       # GET (public recipes)
│   │       │   ├── shared-with-me/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET, PUT, DELETE
│   │       │       ├── summary/route.ts  # GET (public summary)
│   │       │       ├── duplicate/route.ts
│   │       │       ├── visibility/route.ts
│   │       │       ├── tag/
│   │       │       │   ├── route.ts      # POST (add tag)
│   │       │       │   └── [status]/route.ts  # DELETE (remove tag)
│   │       │       ├── save/route.ts     # POST, DELETE
│   │       │       ├── share/
│   │       │       │   ├── route.ts      # POST, GET
│   │       │       │   └── [userId]/route.ts  # DELETE
│   │       │       ├── share-link/
│   │       │       │   ├── route.ts      # POST
│   │       │       │   └── [linkId]/route.ts  # DELETE
│   │       │       ├── rating/route.ts   # POST (upsert)
│   │       │       ├── comments/route.ts # GET, POST
│   │       │       └── images/
│   │       │           └── [imageId]/route.ts  # DELETE
│   │       ├── comments/
│   │       │   └── [id]/route.ts         # PUT, DELETE
│   │       ├── users/
│   │       │   └── search/route.ts       # GET (username search)
│   │       ├── me/
│   │       │   ├── collection/route.ts   # GET
│   │       │   └── shopping-lists/
│   │       │       ├── route.ts          # GET (list), POST (create from recipes)
│   │       │       └── [id]/
│   │       │           ├── route.ts      # GET, PUT, DELETE
│   │       │           └── items/
│   │       │               └── [itemId]/route.ts  # PUT (toggle/edit)
│   │       ├── share/
│   │       │   └── [token]/route.ts      # GET (share link access)
│   │       ├── upload/
│   │       │   └── image/route.ts        # POST (Cloudinary signature)
│   │       └── ai/
│   │           ├── generate/route.ts     # POST (streaming)
│   │           ├── substitute/route.ts   # POST
│   │           ├── nutrition/
│   │           │   └── [recipeId]/route.ts  # POST
│   │           ├── suggest-tags/route.ts # POST (nice-to-have)
│   │           ├── meal-plan/route.ts    # POST (nice-to-have)
│   │           └── generate-image/
│   │               └── [recipeId]/route.ts  # POST (DALL-E)
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx              # combobox/autocomplete
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Logo, nav, auth, dark mode, search
│   │   │   ├── Navigation.tsx           # Sidebar / bottom nav
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx            # Bottom navigation bar
│   │   ├── recipes/
│   │   │   ├── RecipeCard.tsx           # Pinterest-style recipe card
│   │   │   ├── RecipeGrid.tsx           # Masonry grid layout
│   │   │   ├── RecipeForm.tsx           # Full create/edit form
│   │   │   ├── RecipeDetail.tsx         # Full recipe detail view
│   │   │   ├── IngredientList.tsx       # Dynamic ingredient rows
│   │   │   ├── StepList.tsx             # Ordered step rows
│   │   │   ├── ImageUploader.tsx        # Cloudinary + URL + AI image
│   │   │   ├── TagButtons.tsx           # Favorite / To Try / Made Before toggles
│   │   │   ├── ShareDialog.tsx          # Share modal (visibility, username, link)
│   │   │   ├── RecipeScaler.tsx         # Servings adjuster
│   │   │   └── CookingMode.tsx          # Step-by-step mobile overlay
│   │   ├── social/
│   │   │   ├── StarRating.tsx           # 1-5 star rating component
│   │   │   ├── CommentList.tsx          # Comment feed
│   │   │   ├── CommentForm.tsx          # Add/edit comment
│   │   │   └── NutritionCard.tsx        # AI nutrition display
│   │   ├── search/
│   │   │   ├── SearchBar.tsx            # Debounced search input
│   │   │   ├── FilterPanel.tsx          # Sidebar/drawer filters
│   │   │   └── FilterChips.tsx          # Active filter display
│   │   ├── ai/
│   │   │   ├── IngredientInput.tsx      # Chip input for "What's in your fridge?"
│   │   │   ├── AIRecipeStream.tsx       # Streaming recipe output
│   │   │   ├── SubstitutionPopover.tsx  # Ingredient substitution results
│   │   │   └── MealPlanCalendar.tsx     # Weekly meal plan grid (nice-to-have)
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoginPrompt.tsx          # "Log in to view" modal for guests
│   │       ├── CookingTimer.tsx         # Timer component
│   │       ├── ShoppingList.tsx         # Shopping list generator
│   │       └── ShoppingListChecklist.tsx # Checkable list with categories
│   │
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma client singleton
│   │   ├── auth.ts                      # NextAuth v5 config
│   │   ├── auth-helpers.ts              # requireAuth, requireOwner middleware
│   │   ├── openai.ts                    # OpenAI client singleton
│   │   ├── ai-rate-limit.ts             # Per-user rate limiter
│   │   ├── ai-prompts.ts               # All AI system prompts (centralized)
│   │   ├── ai-error-handler.ts          # Silent retry + fallback pattern
│   │   ├── cloudinary.ts               # Upload signature helpers
│   │   ├── search.ts                    # Full-text search query builder
│   │   ├── scaling.ts                   # Recipe quantity scaling logic
│   │   ├── utils.ts                     # General utilities (formatting, etc.)
│   │   └── validators.ts               # Zod schemas (shared frontend/backend)
│   │
│   ├── types/
│   │   ├── recipe.ts                    # Recipe-related types
│   │   ├── ai.ts                        # AI response types
│   │   └── api.ts                       # API request/response types
│   │
│   └── hooks/
│       ├── useRecipes.ts                # React Query hooks for recipes
│       ├── useTags.ts                   # Tag mutation hooks
│       ├── useSearch.ts                 # Debounced search hook
│       ├── useRating.ts                 # Rating mutation hook
│       ├── useComments.ts               # Comment CRUD hooks
│       ├── useAI.ts                     # AI feature hooks (streaming)
│       ├── useTimer.ts                  # Cooking timer hook
│       └── useShoppingList.ts           # Shopping list CRUD hooks
│
├── prisma/
│   ├── schema.prisma                    # Full schema from CTO specs
│   ├── migrations/
│   └── seed.ts                          # 15-20 seed recipes
│
├── public/
│   ├── placeholder-recipe.jpg           # Default recipe image fallback
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.example                         # Environment variable template
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── middleware.ts                         # Auth middleware for route protection
└── README.md
```

---

## Database Schema

Uses the **locked schema from CTO specs** exactly. See [CTO_SPECS.md](CTO_SPECS.md) for the full Prisma schema with all models, enums, and indexes.

Key additions vs the seed schema:

- `User.username` field (unique, alphanumeric + underscores, 3-20 chars, case-sensitive, not changeable)
- `RecipeImage` model (multiple images per recipe, source tracking)
- `RecipeDietaryTag` join table
- `RecipeShare` model (user-to-user sharing)
- `ShareLink` model (token-based link sharing)
- `Rating` model (1-5 per user per recipe)
- `Comment` model
- `Recipe.avgRating` + `ratingCount` (denormalized)
- `UserRecipeTag` with `@@unique([userId, recipeId, status])` (multi-tag)
- `ShoppingList` + `ShoppingListItem` models (database-persisted shopping lists)
- Full-text search vector (added via raw SQL migration)

---

## API Contract

Uses the **locked API contract from CTO specs** exactly. See [CTO_SPECS.md](CTO_SPECS.md) for the complete endpoint table (30+ endpoints across Recipes, Sharing, Tags, Social, AI, Images).

---

## Key Implementation Patterns

### Authorization Middleware

```typescript
// Pattern used across all API routes
export async function requireAuth(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new ApiError(401, 'Unauthorized');
  return session;
}

export async function requireRecipeOwner(recipeId: string, userId: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) throw new ApiError(404, 'Recipe not found');
  if (recipe.authorId !== userId) throw new ApiError(403, 'Forbidden');
  return recipe;
}

export async function canViewRecipe(
  recipeId: string,
  userId?: string,
  shareToken?: string
) {
  // Returns recipe if: owner, public, shared with user, or valid share link
  // Throws 404 if no access
}
```

### Optimistic Updates Pattern

```typescript
// Used for tags, ratings, saves — instant UI feedback
const tagMutation = useMutation({
  mutationFn: (status: TagStatus) => addTag(recipeId, status),
  onMutate: async (status) => {
    await queryClient.cancelQueries(['recipe', recipeId]);
    const previous = queryClient.getQueryData(['recipe', recipeId]);
    queryClient.setQueryData(['recipe', recipeId], (old) => ({
      ...old,
      userTags: [...old.userTags, { status }],
    }));
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['recipe', recipeId], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['recipe', recipeId]);
  },
});
```

### AI Streaming Pattern

```typescript
// Used for recipe generation and meal planning
// Frontend: useChat() or useCompletion() from Vercel AI SDK
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/ai/generate',
  body: { ingredients, preferences },
});
```

### Recipe Quantity Scaling

```typescript
// src/lib/scaling.ts
// Parse: "2 1/2 cups" → { value: 2.5, unit: "cups", original: "2 1/2 cups" }
// Scale: multiply value by factor
// Format: 2.5 → "2 1/2", 0.333 → "1/3"
// Handle edge cases: "pinch", "to taste", "as needed" → don't scale
```

---

## Differences from Library Project

| Aspect           | Library                       | Recipe                                                  |
| ---------------- | ----------------------------- | ------------------------------------------------------- |
| Data complexity  | Simple (Book entity)          | Complex (Recipe → Ingredients → Steps → Images)         |
| Auth model       | RBAC (Admin/Librarian/Member) | Ownership-based + three-tier visibility + share links   |
| Main interaction | Borrow/Return                 | Create/Tag/Share/Rate/Comment                           |
| AI focus         | Recommendations & search      | Generation, substitution, nutrition, image gen          |
| Form complexity  | Simple (single form)          | Complex (dynamic lists, multi-step, image upload)       |
| Social features  | None                          | Ratings (1-5), comments, share-by-username, share links |
| Guest access     | None                          | Summary-only browsing with login prompts                |
| AI provider      | —                             | OpenAI (GPT-4o-mini + DALL-E 3)                         |

---

## Finalized Implementation Decisions

All implementation-level questions have been answered and locked in.

### 1. Username Rules (Locked)

- **Format:** Alphanumeric + underscores only (`/^[a-zA-Z0-9_]{3,20}$/`)
- **Length:** 3-20 characters
- **Case-sensitive:** `JohnDoe` and `johndoe` are different usernames
- **No hyphens** or special characters
- **Not changeable** after initial setup — locked permanently
- **Validation:** Zod schema enforced on both frontend form and API endpoint

```typescript
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');
```

### 2. Recipe Form — Multi-Step Wizard (Locked)

- **5-step guided wizard** with progress bar and back/next navigation
- Steps: Basic Info → Ingredients → Steps → Tags → Images → Review & Submit
- Per-step Zod validation before proceeding to next step
- Draft auto-saved to localStorage to prevent data loss
- Edit mode allows jumping to any step via progress indicator
- See Phase 2 for full component details

### 3. Landing Page — Dashboard for Authenticated Users (Locked)

- **Guests** see: hero section, featured public recipe cards, sign-up CTA
- **Authenticated users** see: dashboard with:
  - Quick stats cards: total recipes, favorites count, recipes shared, average rating
  - Recent recipes grid (last 6 created/edited)
  - Quick action buttons: "Add Recipe", "Browse Community", "AI Generate"
  - Activity feed: recent comments on your recipes, new shares received

### 4. AI Error Handling — Silent Retry + Fallback (Locked)

- All AI calls wrapped in `withAIRetry()` helper (see Phase 6a)
- On first failure: silent retry (same request, no user notification)
- On second failure: generic user-friendly toast message
- **Never expose:** rate limit details, OpenAI error codes, internal errors
- **Always log:** detailed errors server-side with request context for debugging
- Toast messages per feature:
  - Generation: "Could not generate recipe. Please try again."
  - Substitution: "Could not find substitutions. Please try again."
  - Nutrition: "Could not estimate nutrition. Please try again."
  - Image gen: "Could not generate image. Please try again."

### 5. Shopping Lists — Database-Persisted (Locked)

- Shopping lists are stored in the database (not localStorage)
- Two new Prisma models: `ShoppingList` + `ShoppingListItem`
- Full CRUD API: create from selected recipes, view, edit, delete, toggle items
- Accessible across devices and browser sessions
- See Phase 7b for full schema and API details

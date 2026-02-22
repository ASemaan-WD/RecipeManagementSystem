# Recipe Management System - CTO Specs

> **Status:** LOCKED — All decisions finalized. Ready for Senior Developer implementation.

---

## Architecture Overview

### Approach: Full-Stack Monorepo (Next.js)

Same architectural philosophy as the Library project for consistency and speed. Single Next.js app with API routes — no separate backend service.

```
RecipeManagementSystem/
├── src/
│   ├── app/              # Next.js App Router (pages + API routes)
│   ├── components/       # React components
│   ├── lib/              # Shared utilities, AI helpers, auth config
│   ├── types/            # TypeScript type definitions
│   └── hooks/            # Custom React hooks
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   └── seed.ts           # 15-20 seed recipes
├── public/               # Static assets
├── docs/                 # Spec files
├── .env.example          # Environment variable template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Technology Stack (Locked)

### Frontend

| Choice           | Technology                       | Rationale                                                             |
| ---------------- | -------------------------------- | --------------------------------------------------------------------- |
| Framework        | **Next.js 14+ (App Router)**     | Same as Library project, SSR for SEO on public recipes, consistent DX |
| UI Library       | **shadcn/ui + Tailwind CSS**     | Pinterest-style recipe cards, dark mode support built-in              |
| State Management | **React Query (TanStack Query)** | Caching for recipe lists, optimistic updates for tags/ratings         |
| Forms            | **React Hook Form + Zod**        | Complex recipe forms with dynamic ingredient/step lists               |
| Image Handling   | **next/image**                   | Optimized image loading, blur placeholders, responsive sizes          |
| Layout           | **CSS Grid / Masonry**           | Pinterest-style card layout per PM decision                           |

### Backend

| Choice     | Technology                              | Rationale                                                      |
| ---------- | --------------------------------------- | -------------------------------------------------------------- |
| Runtime    | **Node.js**                             | Consistent with Library project                                |
| Framework  | **Next.js API Routes (Route Handlers)** | Unified deployment, no separate server                         |
| ORM        | **Prisma**                              | Handles complex recipe relationships (many-to-many), type-safe |
| Validation | **Zod**                                 | Shared schemas between frontend forms and API validation       |
| Streaming  | **Vercel AI SDK**                       | Streaming AI responses for recipe generation UX                |

### Database

| Choice           | Technology                                       | Rationale                                                                        |
| ---------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Primary DB       | **PostgreSQL**                                   | Relational model suits recipes (many-to-many with ingredients), full-text search |
| Hosting          | **Neon**                                         | Free tier (0.5 GB), serverless driver for Vercel, same as Library project        |
| Full-text Search | **PostgreSQL tsvector/tsquery**                  | Native search across recipe names + ingredients, no external service             |
| Caching          | **Prisma query-level + React Query client-side** | No dedicated cache needed at this scale                                          |

### Authentication

| Choice           | Technology                      | Rationale                                            |
| ---------------- | ------------------------------- | ---------------------------------------------------- |
| Auth Provider    | **NextAuth.js v5 (Auth.js)**    | Same as Library project, supports multiple providers |
| SSO Providers    | **Google OAuth + GitHub OAuth** | Quick setup, broad user coverage                     |
| Session Strategy | **JWT**                         | Stateless, works well with Vercel serverless         |

### AI Integration

| Choice           | Technology                   | Rationale                                                          |
| ---------------- | ---------------------------- | ------------------------------------------------------------------ |
| AI Provider      | **OpenAI API (GPT-4o-mini)** | Single provider for both text and image generation, cost-efficient |
| SDK              | **Vercel AI SDK**            | Streaming support, provider-agnostic, works natively with Next.js  |
| Image Generation | **OpenAI DALL-E 3**          | High-quality food images, on-demand only (user-triggered)          |

### File Storage

| Choice          | Technology                                          | Rationale                                                                         |
| --------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Image Uploads   | **Cloudinary**                                      | Free tier (25 GB), CDN, auto-optimization, upload widget, same as Library project |
| Upload Strategy | **Direct client-side upload** via Cloudinary widget | No server-side file handling needed                                               |

### Deployment

| Choice   | Technology                         | Rationale                                                          |
| -------- | ---------------------------------- | ------------------------------------------------------------------ |
| Platform | **Vercel**                         | Best free tier for Next.js, supports multiple projects per account |
| CI/CD    | **Vercel auto-deploy from GitHub** | Push to `main` → auto build + deploy, preview on PRs               |
| Domain   | **`*.vercel.app`**                 | Free subdomain with HTTPS                                          |

---

## Finalized Decisions

### Decision 1: Same Stack as Library Project — Confirmed

- Mirror the Library project stack for consistency and faster development
- Same patterns, same deployment pipeline, same developer experience
- Reuse auth setup, Prisma patterns, and component library

### Decision 2: Normalized Relational Data Model

Recipes have complex relationships that require a normalized schema:

```
Recipe ──┬──► RecipeIngredient ──► Ingredient
         ├──► RecipeStep (ordered instructions)
         ├──► RecipeImage (multiple image sources)
         ├──► UserRecipeTag (per-user: favorite/to-try/made-before, multiple allowed)
         ├──► RecipeShare (specific user sharing)
         ├──► ShareLink (token-based link sharing)
         ├──► Rating (1-5 stars per user)
         └──► Comment (user comments with timestamps)
```

### Decision 3: Three-Tier Visibility + Share Links

Based on PM decision for Google Docs-style sharing, plus share-by-link:

```
┌───────────────────────────────────────────────────────┐
│  Visibility Enum: PRIVATE | SHARED | PUBLIC           │
├───────────────────────────────────────────────────────┤
│ PRIVATE  → Only author sees the recipe                │
│ SHARED   → Author + RecipeShare entries + ShareLink   │
│ PUBLIC   → All authenticated users + guest summaries  │
└───────────────────────────────────────────────────────┘
```

**Two sharing mechanisms (both available when visibility = SHARED or PUBLIC):**

| Mechanism       | How it works                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **By username** | Author searches for a registered user by username → creates a `RecipeShare` entry → recipe appears in recipient's "Shared with me" section                 |
| **By link**     | Author generates a share link → system creates a `ShareLink` with a unique token → anyone with the link can view the recipe (even if not in `RecipeShare`) |

**Share link architecture:**

- Each share link has a unique token (e.g., `https://app.vercel.app/recipes/share/abc123def`)
- Links can be revoked by the author (delete the `ShareLink` record)
- Accessing a share link as an authenticated user shows full recipe detail
- Accessing as a guest shows the summary with a "Log in to see full recipe" prompt

**Query pattern for recipe access:**

```
WHERE recipe.authorId = currentUser              -- always see own recipes
OR recipe.visibility = 'PUBLIC'                  -- see all public recipes
OR (recipe.visibility = 'SHARED'                 -- see recipes shared with me
    AND EXISTS RecipeShare(userId = currentUser))
OR (shareToken IS PROVIDED                       -- accessed via share link
    AND EXISTS ShareLink(token = shareToken))
```

### Decision 4: AI Provider — OpenAI (Locked)

**Single provider:** OpenAI covers all AI needs in one account/API key.

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Client   │────►│ Next.js API     │────►│ OpenAI API       │
│ (React)   │◄────│ Route Handler   │◄────│                  │
└──────────┘     └─────────────────┘     │ GPT-4o-mini:     │
                         │                │  - Generation    │
                         ▼                │  - Substitution  │
                  ┌─────────────┐         │  - Nutrition     │
                  │  PostgreSQL  │         │  - Smart tags    │
                  │  (cache)     │         │  - Meal plans    │
                  └─────────────┘         │                  │
                                          │ DALL-E 3:        │
                                          │  - Image gen     │
                                          └──────────────────┘
```

| AI Feature                   | Model       | Pattern                       | Caching                                    |
| ---------------------------- | ----------- | ----------------------------- | ------------------------------------------ |
| Recipe Generator             | GPT-4o-mini | Streaming response            | No cache (unique per request)              |
| Ingredient Substitution      | GPT-4o-mini | Request-response              | Optional cache per ingredient-recipe pair  |
| Nutritional Estimates        | GPT-4o-mini | Request-response              | Cache in `Recipe.nutritionData` JSON field |
| Smart Tagging (nice-to-have) | GPT-4o-mini | Request-response              | No cache                                   |
| Meal Plan (nice-to-have)     | GPT-4o-mini | Streaming response            | No cache                                   |
| Image Generation             | DALL-E 3    | Async request, on-demand only | Store generated URL in `RecipeImage`       |

**Rate limiting:** All AI endpoints rate-limited per user (e.g., 20 requests/hour for generation, 50/hour for substitution, 10/hour for DALL-E).

### Decision 5: Image Strategy — Three Sources, On-Demand AI

```
┌────────────────────────────────────────────────────────────┐
│  Image Priority Chain (display order)                      │
│  1. Cloudinary upload (user uploaded)                     │
│  2. External URL (user pasted)                            │
│  3. AI-generated via DALL-E (user clicked "Generate")     │
│  4. Default placeholder (static fallback from /public/)   │
└────────────────────────────────────────────────────────────┘
```

- **Upload:** Cloudinary widget → returns CDN URL → stored in `RecipeImage` table
- **URL:** User pastes URL → validated → stored directly
- **AI-generated:** User clicks "Generate Image" button → calls DALL-E 3 → stores result URL. **Not automatic** — only triggered on user request to control costs
- **Fallback:** Static placeholder image from `/public/` for recipes with no image at all

### Decision 6: Multi-Tag Support — Users Can Stack Tags

A user can apply **multiple status tags** to the same recipe simultaneously:

```
Example: A recipe can be both "Favorite" AND "Made Before" for the same user
```

**Schema impact:** The `UserRecipeTag` unique constraint is `@@unique([userId, recipeId, status])` — this allows multiple rows per user-recipe pair (one per status), but prevents duplicate statuses. Already correct in the schema.

### Decision 7: Sharing Notifications — "Shared With Me" Section (Extensible)

**V1 (launch):** "Shared with me" section in the user's collection page.

- When a recipe is shared with a user, it appears in their "Shared with me" tab
- No active notification — user discovers shared recipes when they visit the section

**Architecture for future in-app notifications:**

```prisma
// Ready to add when needed — NOT implemented in V1
model Notification {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  type      String   // "recipe_shared", "comment_added", "rating_received"
  data      Json     // { recipeId, fromUserId, etc. }
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read])
}
```

- The `RecipeShare` creation logic is the hook point — when `RecipeShare` is created, a future notification service can also create a `Notification` record
- API endpoint pattern: `GET /api/me/notifications` + `PUT /api/notifications/[id]/read`
- UI pattern: bell icon in header with unread count badge
- **Not built in V1** but the share creation flow is structured to allow this addition without refactoring

### Decision 8: Guest Access — API-Level Enforcement

```
Public recipe list endpoint:
  GET /api/recipes/public → returns summary fields only (no auth required)
  Summary: { id, name, image, prepTime, cookTime, difficulty, cuisine, avgRating }

Share link endpoint:
  GET /api/recipes/share/[token] → if authenticated: full detail; if guest: summary + login prompt

Recipe detail endpoint:
  GET /api/recipes/[id] → requires authentication
  Returns: full recipe with ingredients, steps, comments, nutrition
```

Middleware checks auth status and strips fields accordingly. Guest-visible pages are server-rendered for SEO.

### Decision 9: Social Features — Ratings & Comments

**Ratings:**

- One rating per user per recipe (upsert pattern)
- Average rating calculated and stored as a denormalized field on Recipe for query performance
- Recalculated on each new rating via a simple `AVG()` query

**Comments:**

- Standard CRUD with ownership checks
- Author of recipe can delete any comment on their recipe
- Users can edit/delete their own comments
- No nested replies (flat comment list) — keeps complexity manageable

---

## Infrastructure Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      User Browser                        │
│          (Desktop / Mobile responsive)                   │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│              Vercel (Next.js App)                         │
│  ┌───────────────────┐  ┌──────────────────────────┐     │
│  │   App Router       │  │   API Route Handlers     │     │
│  │   (SSR + CSR)      │  │   /api/recipes/*         │     │
│  │                    │  │   /api/ai/*              │     │
│  │   - Recipe pages   │  │   /api/auth/*            │     │
│  │   - Community      │  │   /api/tags/*            │     │
│  │   - AI tools       │  │   /api/comments/*        │     │
│  │   - Profile        │  │   /api/ratings/*         │     │
│  │   - Share links    │  │   /api/share/*           │     │
│  └───────────────────┘  └──────────┬───────────────┘     │
└──────────────────────────────────────┼───────────────────┘
                                       │
               ┌───────────────────────┼───────────────────┐
               │                       │                   │
               ▼                       ▼                   ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Neon PostgreSQL │   │   OpenAI API     │   │   Cloudinary     │
│                  │   │                  │   │   (Image CDN)    │
│   - Users        │   │   GPT-4o-mini:  │   │                  │
│   - Recipes      │   │   - Generation  │   │   - Uploads      │
│   - Ingredients  │   │   - Substitution│   │   - Transforms   │
│   - Shares       │   │   - Nutrition   │   │   - Optimization │
│   - ShareLinks   │   │                  │   │                  │
│   - Ratings      │   │   DALL-E 3:     │   │                  │
│   - Comments     │   │   - Image gen   │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
               │
               ▼
┌──────────────────┐
│  OAuth Providers │
│  (Google/GitHub) │
└──────────────────┘
```

---

## Database Schema (Locked)

```prisma
// ─── ENUMS ───

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum Visibility {
  PRIVATE
  SHARED
  PUBLIC
}

enum TagStatus {
  FAVORITE
  TO_TRY
  MADE_BEFORE
}

enum ImageSource {
  UPLOAD        // Cloudinary upload
  URL           // External URL
  AI_GENERATED  // DALL-E 3 (on-demand)
}

// ─── MODELS ───

model User {
  id            String          @id @default(cuid())
  name          String?
  email         String          @unique
  username      String?         @unique  // for share-by-username lookup
  image         String?
  recipes       Recipe[]        @relation("AuthoredRecipes")
  tags          UserRecipeTag[]
  savedRecipes  SavedRecipe[]
  ratings       Rating[]
  comments      Comment[]
  sharedWithMe  RecipeShare[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model Recipe {
  id              String            @id @default(cuid())
  name            String
  description     String?
  prepTime        Int?              // in minutes
  cookTime        Int?              // in minutes
  servings        Int?
  difficulty      Difficulty?
  cuisineType     String?
  visibility      Visibility        @default(PRIVATE)
  nutritionData   Json?             // cached AI nutrition estimates
  avgRating       Float?            // denormalized average rating
  ratingCount     Int               @default(0)

  // Relations
  author          User              @relation("AuthoredRecipes", fields: [authorId], references: [id])
  authorId        String
  images          RecipeImage[]
  ingredients     RecipeIngredient[]
  steps           RecipeStep[]
  dietaryTags     RecipeDietaryTag[]
  userTags        UserRecipeTag[]
  shares          RecipeShare[]
  shareLinks      ShareLink[]
  savedBy         SavedRecipe[]
  ratings         Rating[]
  comments        Comment[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([authorId])
  @@index([visibility])
  @@index([cuisineType])
}

model RecipeImage {
  id        String      @id @default(cuid())
  recipe    Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  url       String
  source    ImageSource
  isPrimary Boolean     @default(false)
  order     Int         @default(0)

  @@index([recipeId])
}

model Ingredient {
  id      String             @id @default(cuid())
  name    String             @unique
  recipes RecipeIngredient[]
}

model RecipeIngredient {
  id           String     @id @default(cuid())
  recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId     String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
  ingredientId String
  quantity     String?    // "2 cups", "1 tbsp" — kept as string for flexibility
  notes        String?    // "finely diced", "optional"
  order        Int        @default(0)

  @@unique([recipeId, ingredientId])
}

model RecipeStep {
  id          String @id @default(cuid())
  recipe      Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId    String
  stepNumber  Int
  instruction String
  duration    Int?   // optional timer in minutes

  @@index([recipeId])
}

model DietaryTag {
  id      String             @id @default(cuid())
  name    String             @unique // "vegan", "gluten-free", "dairy-free", etc.
  recipes RecipeDietaryTag[]
}

model RecipeDietaryTag {
  id           String     @id @default(cuid())
  recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId     String
  dietaryTag   DietaryTag @relation(fields: [dietaryTagId], references: [id])
  dietaryTagId String

  @@unique([recipeId, dietaryTagId])
}

model UserRecipeTag {
  id       String    @id @default(cuid())
  user     User      @relation(fields: [userId], references: [id])
  userId   String
  recipe   Recipe    @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId String
  status   TagStatus

  @@unique([userId, recipeId, status])  // allows multiple statuses per user-recipe
}

model RecipeShare {
  id        String   @id @default(cuid())
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  sharedAt  DateTime @default(now())

  @@unique([recipeId, userId])
}

model ShareLink {
  id        String   @id @default(cuid())
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  token     String   @unique @default(cuid())  // unique shareable token
  isActive  Boolean  @default(true)            // author can revoke
  createdAt DateTime @default(now())

  @@index([token])
}

model SavedRecipe {
  id       String   @id @default(cuid())
  user     User     @relation(fields: [userId], references: [id])
  userId   String
  recipe   Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId String
  savedAt  DateTime @default(now())

  @@unique([userId, recipeId])
}

model Rating {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  value     Int      // 1-5
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, recipeId])
}

model Comment {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([recipeId])
}
```

---

## API Contract (Locked)

### Recipes

| Method | Endpoint                      | Auth     | Description                                      |
| ------ | ----------------------------- | -------- | ------------------------------------------------ |
| GET    | `/api/recipes`                | Required | List my recipes (with search/filters/pagination) |
| GET    | `/api/recipes/public`         | Optional | Browse public recipes (summary only for guests)  |
| GET    | `/api/recipes/shared-with-me` | Required | Recipes shared specifically with me              |
| GET    | `/api/recipes/[id]`           | Required | Get full recipe detail (if authorized)           |
| GET    | `/api/recipes/[id]/summary`   | None     | Public recipe summary (for guests/SEO)           |
| POST   | `/api/recipes`                | Required | Create recipe                                    |
| PUT    | `/api/recipes/[id]`           | Required | Update recipe (owner only)                       |
| DELETE | `/api/recipes/[id]`           | Required | Delete recipe (owner only)                       |
| POST   | `/api/recipes/[id]/duplicate` | Required | Fork/duplicate a recipe                          |

### Visibility & Sharing

| Method | Endpoint                                | Auth     | Description                                                      |
| ------ | --------------------------------------- | -------- | ---------------------------------------------------------------- |
| PUT    | `/api/recipes/[id]/visibility`          | Required | Set visibility: PRIVATE/SHARED/PUBLIC (owner only)               |
| POST   | `/api/recipes/[id]/share`               | Required | Share with user by username (owner only)                         |
| DELETE | `/api/recipes/[id]/share/[userId]`      | Required | Revoke share for a user (owner only)                             |
| GET    | `/api/recipes/[id]/shares`              | Required | List users this recipe is shared with (owner only)               |
| POST   | `/api/recipes/[id]/share-link`          | Required | Generate a share link (owner only)                               |
| DELETE | `/api/recipes/[id]/share-link/[linkId]` | Required | Revoke a share link (owner only)                                 |
| GET    | `/api/share/[token]`                    | Optional | Access recipe via share link (auth: full detail; guest: summary) |

### User Lookup

| Method | Endpoint                       | Auth     | Description                                 |
| ------ | ------------------------------ | -------- | ------------------------------------------- |
| GET    | `/api/users/search?q=username` | Required | Search users by username (for share dialog) |

### Tags & Collections

| Method | Endpoint                         | Auth     | Description                                              |
| ------ | -------------------------------- | -------- | -------------------------------------------------------- |
| POST   | `/api/recipes/[id]/tag`          | Required | Add tag (favorite/to-try/made-before) — multiple allowed |
| DELETE | `/api/recipes/[id]/tag/[status]` | Required | Remove specific tag                                      |
| POST   | `/api/recipes/[id]/save`         | Required | Save a public/shared recipe to my collection             |
| DELETE | `/api/recipes/[id]/save`         | Required | Remove from my saved collection                          |
| GET    | `/api/me/collection`             | Required | My recipes + saved + tagged (with filters)               |

### Social

| Method | Endpoint                     | Auth     | Description                           |
| ------ | ---------------------------- | -------- | ------------------------------------- |
| POST   | `/api/recipes/[id]/rating`   | Required | Rate recipe 1-5 (upsert)              |
| GET    | `/api/recipes/[id]/comments` | Required | List comments on a recipe             |
| POST   | `/api/recipes/[id]/comments` | Required | Add comment                           |
| PUT    | `/api/comments/[id]`         | Required | Edit own comment                      |
| DELETE | `/api/comments/[id]`         | Required | Delete comment (own or recipe author) |

### AI

| Method | Endpoint                            | Auth     | Description                                                       |
| ------ | ----------------------------------- | -------- | ----------------------------------------------------------------- |
| POST   | `/api/ai/generate`                  | Required | Generate recipe from ingredients (streaming, GPT-4o-mini)         |
| POST   | `/api/ai/substitute`                | Required | Suggest ingredient substitutions (GPT-4o-mini)                    |
| POST   | `/api/ai/nutrition/[recipeId]`      | Required | Estimate nutritional info, cached (GPT-4o-mini)                   |
| POST   | `/api/ai/suggest-tags`              | Required | AI-suggest cuisine/dietary/difficulty (nice-to-have, GPT-4o-mini) |
| POST   | `/api/ai/meal-plan`                 | Required | Generate weekly meal plan (nice-to-have, GPT-4o-mini)             |
| POST   | `/api/ai/generate-image/[recipeId]` | Required | Generate image on user request (DALL-E 3)                         |

### Images

| Method | Endpoint                             | Auth     | Description                     |
| ------ | ------------------------------------ | -------- | ------------------------------- |
| POST   | `/api/upload/image`                  | Required | Get Cloudinary upload signature |
| DELETE | `/api/recipes/[id]/images/[imageId]` | Required | Remove image from recipe        |

---

## Security Considerations

- **Environment variables only** for all API keys and secrets (`OPENAI_API_KEY`, `CLOUDINARY_*`, `DATABASE_URL`, etc.)
- **Recipe ownership** enforced at API level — users can only edit/delete their own recipes
- **Visibility checks** on every recipe read — server-side authorization middleware
- **Share validation** — only recipe owners can manage shares and share links
- **Share link tokens** — cryptographically random, revocable, no enumeration possible
- **Rate limiting** on AI endpoints (per user, per hour): 20/hr generation, 50/hr substitution, 10/hr DALL-E
- **Input sanitization** — recipe names, ingredients, comments are user-generated content (XSS prevention)
- **Image URL validation** — validate external URLs before storing
- **Comment moderation** — recipe authors can delete comments on their recipes
- **CSRF protection** via NextAuth.js built-in CSRF tokens
- **Cloudinary signed uploads** — prevent unauthorized file uploads
- **Username search** — only returns username + display name (no email leakage)

---

## Performance Considerations

- **Denormalized `avgRating`** on Recipe table avoids expensive JOINs on list views
- **Database indexes** on `authorId`, `visibility`, `cuisineType`, `recipeId` (comments, steps), `ShareLink.token`
- **PostgreSQL full-text search** using `tsvector` on recipe name + ingredient names — no external search service
- **React Query caching** for recipe lists and details — reduces redundant API calls
- **next/image** for automatic image optimization and lazy loading
- **ISR (Incremental Static Regeneration)** for public recipe pages — SEO + performance
- **Streaming AI responses** — users see results appearing in real-time instead of waiting
- **DALL-E on-demand only** — no background image generation, controls OpenAI costs

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/recipe_db

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# OpenAI (text + image generation)
OPENAI_API_KEY=sk-...

# Cloudinary (image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Cost Estimates (Free Tier Usage)

| Service                 | Free Tier                              | Expected Usage                  | Within Free Tier? |
| ----------------------- | -------------------------------------- | ------------------------------- | ----------------- |
| **Vercel**              | 100 GB bandwidth, serverless functions | Low-moderate traffic            | Yes               |
| **Neon**                | 0.5 GB storage, autoscaling            | ~15-20 seed recipes + user data | Yes               |
| **Cloudinary**          | 25 GB storage, 25 GB bandwidth         | User-uploaded recipe images     | Yes               |
| **OpenAI GPT-4o-mini**  | Pay-per-use (~$0.15/1M input tokens)   | ~$1-5/month for moderate usage  | Minimal cost      |
| **OpenAI DALL-E 3**     | Pay-per-use (~$0.04/image)             | On-demand only, ~$1-2/month     | Minimal cost      |
| **Google/GitHub OAuth** | Free                                   | Unlimited                       | Yes               |

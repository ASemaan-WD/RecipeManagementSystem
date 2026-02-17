# Recipe Management System - Senior Developer Specs

> **Status:** SEED — These specs will be refined after CTO decisions are finalized.

---

## Implementation Plan (Phased)

### Phase 1: Project Scaffolding & Auth (Foundation)
**Goal:** Bootable app with authentication and basic layout.

1. Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS
2. Install and configure shadcn/ui components
3. Set up Prisma with PostgreSQL connection
4. Define initial database schema (User, Recipe, Ingredient models)
5. Configure NextAuth.js with Google + GitHub OAuth
6. Create layout: navigation, header with auth state, main content area
7. Seed database with test user accounts

### Phase 2: Recipe Management (Core CRUD)
**Goal:** Full recipe management with structured data.

1. Define Prisma schema (see Database Schema section below)
2. Build API routes:
   - `GET /api/recipes` — list recipes (with pagination, filters, search)
   - `GET /api/recipes/[id]` — get single recipe with ingredients and steps
   - `POST /api/recipes` — create recipe
   - `PUT /api/recipes/[id]` — update recipe (owner only)
   - `DELETE /api/recipes/[id]` — delete recipe (owner only)
3. Build UI pages:
   - `/recipes` — recipe grid (card layout with images, prep time, tags)
   - `/recipes/[id]` — recipe detail page (ingredients, steps, metadata)
   - `/recipes/new` — add recipe form (multi-step or tabbed)
   - `/recipes/[id]/edit` — edit recipe form
4. Recipe form complexity:
   - Dynamic ingredient list (add/remove rows)
   - Ordered instruction steps (add/remove/reorder)
   - Tag selection (cuisine, dietary, difficulty)
   - Image URL input
5. Implement with React Query + React Hook Form + Zod

### Phase 3: Status Tagging System
**Goal:** Users can tag recipes with personal statuses.

1. Define UserRecipeTag model (many-to-many: User ↔ Recipe with tag type)
2. Build API routes:
   - `POST /api/recipes/[id]/tag` — add/update tag (favorite/to-try/made-before)
   - `DELETE /api/recipes/[id]/tag` — remove tag
   - `GET /api/me/tagged?status=favorite` — get my tagged recipes by status
3. Build UI:
   - Tag toggle buttons on recipe cards and detail pages
   - "My Collection" page with tabs: All, Favorites, To Try, Made Before
   - Visual indicators (heart icon, bookmark icon, checkmark icon)

### Phase 4: Search & Discovery
**Goal:** Powerful search across recipes.

1. Implement search API:
   - `GET /api/recipes?q=searchterm` — search across name, ingredients, cuisine
   - Filter params: `cuisine`, `dietary`, `difficulty`, `maxPrepTime`, `status`
   - Sort: `name`, `createdAt`, `prepTime`, `rating`
2. Build search UI:
   - Search bar with debounced input
   - Filter sidebar/panel with checkboxes and sliders
   - Recipe cards in grid layout with key info visible
3. PostgreSQL full-text search on recipe name + ingredient names

### Phase 5: Multi-user & Sharing
**Goal:** Users can share recipes and browse others'.

1. Add `visibility` field to Recipe: `PRIVATE` | `PUBLIC`
2. Build API routes:
   - `GET /api/recipes/public` — browse all public recipes
   - `POST /api/recipes/[id]/visibility` — toggle public/private
   - `POST /api/recipes/[id]/save` — save someone else's recipe to my collection
3. Build UI:
   - "Community Recipes" page showing all public recipes
   - "Share" button on recipe detail that toggles visibility
   - "Save to My Collection" button on community recipes
   - User profile page showing their public recipes

### Phase 6: AI Features
**Goal:** Integrate AI capabilities that enhance the cooking experience.

1. **AI Recipe Generator ("What can I make?")**
   - Endpoint: `POST /api/ai/generate`
   - Input: list of ingredients the user has
   - Logic: AI generates a recipe using those ingredients
   - UI: "What's in your fridge?" page with ingredient input chips → AI generates recipe → user can save it

2. **Ingredient Substitution**
   - Endpoint: `POST /api/ai/substitute`
   - Input: recipe ID + ingredient to substitute
   - Logic: AI suggests alternatives considering the recipe context
   - UI: "Substitute" button next to each ingredient on recipe detail

3. **AI Nutritional Estimates**
   - Endpoint: `POST /api/ai/nutrition/[recipeId]`
   - Logic: AI estimates calories, protein, carbs, fat from ingredients
   - Cache result in database
   - UI: Nutrition card on recipe detail page

4. **Smart Tagging on Creation**
   - When user adds a recipe, send name + ingredients to AI
   - AI suggests: cuisine type, dietary tags, difficulty level
   - UI: Auto-fill suggestions as pills/chips that user accepts or removes

5. **Meal Plan Suggestions (Stretch)**
   - Endpoint: `POST /api/ai/meal-plan`
   - Input: user's recipe collection + preferences
   - Logic: AI creates a 7-day meal plan from their recipes
   - UI: Weekly calendar view with assigned recipes

### Phase 7: Extra Features & Polish
**Goal:** Creative additions and final polish.

1. Recipe scaling (adjust servings → auto-recalculate ingredient quantities)
2. Shopping list generator (select recipes → combined ingredient list)
3. Cooking timer integration on recipe detail page
4. Print-friendly recipe view (CSS print styles)
5. Dark mode toggle
6. Responsive design pass (mobile-first for cooking use case)

### Phase 8: Deployment & Ship
**Goal:** Production deployment.

1. Set up production database
2. Configure environment variables
3. Deploy to Vercel/Railway
4. Test all flows end-to-end
5. Write README with setup instructions
6. Push to GitHub

---

## Proposed File Structure

```
RecipeManagementSystem/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home/dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── recipes/
│   │   │   ├── page.tsx          # My recipes
│   │   │   ├── [id]/page.tsx     # Recipe detail
│   │   │   ├── new/page.tsx      # Add recipe
│   │   │   └── [id]/edit/page.tsx
│   │   ├── community/page.tsx    # Public recipes
│   │   ├── my-collection/page.tsx # Tagged recipes (favorites, to-try, etc.)
│   │   ├── ai/
│   │   │   ├── generate/page.tsx  # "What can I make?" page
│   │   │   └── meal-plan/page.tsx # AI meal planner
│   │   ├── profile/
│   │   │   └── [id]/page.tsx     # User profile
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── recipes/
│   │       ├── tags/
│   │       ├── users/
│   │       └── ai/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Header, Navigation, Footer
│   │   ├── recipes/              # RecipeCard, RecipeForm, IngredientList, StepList
│   │   ├── ai/                   # AI-specific components
│   │   └── shared/               # Reusable components
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # NextAuth config
│   │   ├── ai.ts                 # AI helper functions
│   │   └── utils.ts              # Utility functions (scaling, formatting)
│   ├── types/                    # TypeScript type definitions
│   └── hooks/                    # Custom React hooks
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Database Schema (Seed)

```prisma
model User {
  id            String          @id @default(cuid())
  name          String?
  email         String          @unique
  image         String?
  recipes       Recipe[]
  tags          UserRecipeTag[]
  savedRecipes  SavedRecipe[]
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
  image           String?
  visibility      Visibility        @default(PRIVATE)
  nutritionData   Json?             // cached AI nutrition estimates
  author          User              @relation(fields: [authorId], references: [id])
  authorId        String
  ingredients     RecipeIngredient[]
  steps           RecipeStep[]
  tags            UserRecipeTag[]
  savedBy         SavedRecipe[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum Visibility {
  PRIVATE
  PUBLIC
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
  id        String @id @default(cuid())
  recipe    Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId  String
  stepNumber Int
  instruction String
  duration   Int?   // optional timer in minutes
}

model UserRecipeTag {
  id       String    @id @default(cuid())
  user     User      @relation(fields: [userId], references: [id])
  userId   String
  recipe   Recipe    @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  recipeId String
  status   TagStatus

  @@unique([userId, recipeId])
}

enum TagStatus {
  FAVORITE
  TO_TRY
  MADE_BEFORE
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

model DietaryTag {
  id   String @id @default(cuid())
  name String @unique // "vegan", "gluten-free", "dairy-free", etc.
}
```

---

## API Contract Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/recipes | Required | List my recipes (with search/filters) |
| GET | /api/recipes/public | Optional | Browse public recipes |
| GET | /api/recipes/[id] | Required | Get recipe detail (if owner or public) |
| POST | /api/recipes | Required | Create recipe |
| PUT | /api/recipes/[id] | Required | Update recipe (owner only) |
| DELETE | /api/recipes/[id] | Required | Delete recipe (owner only) |
| POST | /api/recipes/[id]/tag | Required | Tag recipe (favorite/to-try/made-before) |
| DELETE | /api/recipes/[id]/tag | Required | Remove tag |
| POST | /api/recipes/[id]/visibility | Required | Toggle public/private (owner only) |
| POST | /api/recipes/[id]/save | Required | Save public recipe to my collection |
| GET | /api/me/collection | Required | My tagged/saved recipes |
| POST | /api/ai/generate | Required | Generate recipe from ingredients |
| POST | /api/ai/substitute | Required | Get ingredient substitution |
| POST | /api/ai/nutrition/[id] | Required | Get AI nutrition estimate |
| POST | /api/ai/suggest-tags | Required | Get AI tag suggestions |
| POST | /api/ai/meal-plan | Required | Generate meal plan |

---

## Key Implementation Notes

- Recipe form is the most complex UI — use a multi-step form or tabbed layout
- Dynamic ingredient list: use `useFieldArray` from React Hook Form
- Ordered steps: implement drag-to-reorder or up/down buttons
- Recipe scaling: multiply all ingredient quantities by (newServings / originalServings)
- Shopping list: aggregate ingredients across recipes, combine duplicates
- AI responses should stream for recipe generation (can be long)
- Cache nutrition data in Recipe.nutritionData (JSON field) after first AI call
- Ingredient table enables powerful queries: "recipes with chicken AND rice"

---

## Differences from Library Project

| Aspect | Library | Recipe |
|--------|---------|--------|
| Data complexity | Simple (Book entity) | Complex (Recipe → Ingredients → Steps) |
| Auth model | RBAC (Admin/Librarian/Member) | Ownership-based (my recipes vs public) |
| Main interaction | Borrow/Return | Create/Tag/Share |
| AI focus | Recommendations & search | Generation & substitution |
| Form complexity | Simple (single form) | Complex (dynamic lists, multi-step) |

---

## Open Items (Awaiting CTO / PM Decisions)

- Sharing model (private-first vs public-first)
- Social features scope (comments, ratings)
- AI provider choice
- Image handling approach
- Whether to include recipe URL import feature
- Hosting platform

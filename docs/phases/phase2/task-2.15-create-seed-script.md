---
task_id: 'task-2.15'
title: 'Create Seed Script'
phase: 2
task_number: 15
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-2.12'
  - 'task-2.13'
blocks: []
created_at: '2026-02-18'
---

# Create Seed Script

## Current State

> Tasks 2.1–2.14 have defined the full database schema, run the initial migration, set up full-text search, and configured the Prisma client singleton. The database exists but has no data. The application needs seed data for development and demo purposes.

- **What exists**: All database tables, indexes, and full-text search infrastructure; `src/lib/db.ts` Prisma client singleton; no `prisma/seed.ts` file
- **What is missing**: `prisma/seed.ts` with seed data; `prisma` seed configuration in `package.json`
- **Relevant code**:
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.15: full seed requirements
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 8: seed data outline
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — File structure shows `prisma/seed.ts`
  - `prisma/schema.prisma` — all model definitions that the seed script must populate

---

## Desired Outcome

- **End state**: `prisma/seed.ts` creates a system user, test users, dietary tags, 15–20 diverse recipes with full data (ingredients, steps, images, dietary tags, nutrition data), and sample ratings/comments. `package.json` is configured to run the seed via `npx prisma db seed`.
- **User-facing changes**: None (seed data is for development/demo)
- **Developer-facing changes**: `npx prisma db seed` populates the database with realistic demo data

---

## Scope & Boundaries

### In Scope

- Create `prisma/seed.ts` with all seed data
- Configure `package.json` with the Prisma seed command
- Install `tsx` as a dev dependency for running TypeScript seed scripts (preferred over `ts-node` for ESM compatibility)
- Seed the following data:
  - System user "RecipeApp" for seeded recipes
  - 2–3 test user accounts
  - All dietary tags (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo, Halal, Low-Carb)
  - 15–20 diverse recipes across multiple cuisines
  - Ingredients, steps, images, and dietary tags for each recipe
  - Sample ratings and comments for demo purposes

### Out of Scope

- Running the seed script (that is part of the verification step, not a deliverable)
- Creating shopping list seed data
- Creating share/saved recipe seed data
- Adding AI-generated content to seed recipes

### Dependencies

- Task 2.12 (Prisma client singleton must exist)
- Task 2.13 (Initial migration must be complete — all tables must exist)

---

## Implementation Details

### Section 1: Configure Seed Command

**What to do**: Add the Prisma seed configuration to `package.json` and install `tsx`.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.15: `"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }`
- Prisma docs on seeding

**Specific requirements**:

- Install `tsx` as a dev dependency: `npm install -D tsx`
- Add the Prisma seed configuration to `package.json`:
  ```json
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
  ```

**Note**: ROADMAP suggests `ts-node` with CommonJS compiler options. However, `tsx` is the modern, simpler alternative that handles ESM and TypeScript natively without configuration. Use `tsx` instead of `ts-node` for cleaner setup.

---

### Section 2: Create Seed Script

**What to do**: Create `prisma/seed.ts` with comprehensive seed data.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.15
- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 8 seed outline
- `prisma/schema.prisma` — model definitions for all seeded entities

**Specific requirements**:

#### 2a: Imports and Setup

- Import `PrismaClient` from `@prisma/client`
- Create a new `PrismaClient` instance (do NOT use the singleton from `src/lib/db.ts` — seed scripts run outside the Next.js context)
- Wrap the main logic in an async `main()` function
- Add proper error handling with disconnect in a `finally` block

#### 2b: System User

- Create a system user with:
  - `name`: "RecipeApp"
  - `username`: "recipeapp"
  - `email`: "system@recipeapp.dev"
  - `image`: a placeholder avatar URL
- Use `upsert` to make the seed script idempotent

#### 2c: Test Users

- Create 2–3 test users for development:
  - e.g., "Alice Chef" (alice_chef), "Bob Baker" (bob_baker)
  - Each with a name, username, email, and image
- Use `upsert` for idempotency

#### 2d: Dietary Tags

- Seed all dietary tags: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo, Halal, Low-Carb
- Use `upsert` (matching on `name`) for idempotency

#### 2e: Recipes (15–20)

- Create diverse recipes across multiple cuisines:
  - 3–4 Italian (e.g., Pasta Carbonara, Margherita Pizza, Risotto, Tiramisu)
  - 3–4 Asian (e.g., Pad Thai, Sushi Rolls, Ramen, Chicken Stir-Fry)
  - 2–3 Mexican (e.g., Chicken Tacos, Guacamole, Enchiladas)
  - 2–3 Middle Eastern (e.g., Falafel, Hummus, Shawarma)
  - 2–3 American (e.g., Classic Burger, Mac and Cheese, BBQ Ribs)
  - 2–3 Indian (e.g., Chicken Tikka Masala, Dal)
  - 1–2 French (e.g., Crepes, Ratatouille)
  - 1 Mediterranean (e.g., Greek Salad)
- Each recipe includes:
  - `name`, `description`, `prepTime`, `cookTime`, `servings`
  - `difficulty`: varied across EASY, MEDIUM, HARD
  - `cuisineType`: matching the cuisine category
  - `visibility`: PUBLIC (all seed recipes are public)
  - `authorId`: system user's ID
  - `ingredients`: full list with quantities via `RecipeIngredient` + `Ingredient`
  - `steps`: 4–8 step-by-step instructions with timers where appropriate
  - `images`: at least one image URL per recipe (use placeholder URLs from Unsplash food category, e.g., `https://images.unsplash.com/photo-XXXXX?w=800`)
  - `dietaryTags`: appropriate dietary tags via `RecipeDietaryTag` + `DietaryTag`
  - `nutritionData`: pre-calculated JSON (calories, protein, carbs, fat, fiber)

#### 2f: Ratings and Comments

- Add sample ratings (2–5 per recipe) from test users
- Add sample comments (1–3 per recipe) from test users
- Update `avgRating` and `ratingCount` on each rated recipe

#### 2g: Idempotency

- The entire seed script should be safe to run multiple times
- Use `upsert` for users, dietary tags, and ingredients
- For recipes, either use `upsert` on a unique field or delete-and-recreate within a transaction
- Consider wrapping the recipe seeding in a transaction for atomicity

**Patterns to follow**:

- Use `prisma.model.upsert()` for idempotent creates
- Use `prisma.$transaction()` for atomic operations
- Log progress to console (e.g., "Seeding users...", "Seeding recipes...", "Done!")

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] `tsx` is installed as a dev dependency
- [ ] `prisma.seed` is configured in `package.json`

### Functional Verification

- [ ] `npx prisma db seed` runs without errors
- [ ] System user "RecipeApp" exists in the database
- [ ] 2–3 test users exist in the database
- [ ] All dietary tags (9+) exist in the database
- [ ] 15–20 recipes exist with full data (ingredients, steps, images, dietary tags)
- [ ] Each recipe has at least one image
- [ ] Each recipe has ingredients with quantities
- [ ] Each recipe has 4–8 steps
- [ ] Sample ratings and comments exist
- [ ] `avgRating` and `ratingCount` are correctly set on rated recipes
- [ ] Running the seed script a second time does not create duplicates (idempotent)

### Code Quality Checks

- [ ] Seed data is realistic and diverse
- [ ] No hardcoded database IDs (use `cuid()` or let Prisma generate)
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Proper error handling with `finally` disconnect

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

---
task_id: 'task-2.8'
title: 'Create Seed Script & DB Utilities'
phase: 2
task_number: 8
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-2.6'
blocks: []
created_at: '2026-02-18'
---

# Create Seed Script & DB Utilities

## Current State

> Tasks 2.1–2.7 have defined the full database schema, run the initial migration, set up full-text search, and configured the Prisma client singleton. The database exists but has no data, and there are no convenience scripts for database operations.

- **What exists**: All database tables, indexes, and full-text search infrastructure; `src/lib/db.ts` Prisma client singleton; standard Next.js scripts in `package.json`
- **What is missing**: `prisma/seed.ts` with seed data; `prisma` seed configuration in `package.json`; convenience `db:*` scripts in `package.json`
- **Relevant code**:
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Tasks 2.15 and 2.16
  - [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 8: seed data outline
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — File structure shows `prisma/seed.ts`
  - `prisma/schema.prisma` — all model definitions that the seed script must populate
  - `package.json` — target file for script additions

---

## Desired Outcome

- **End state**: `prisma/seed.ts` creates a system user, test users, dietary tags, 15–20 diverse recipes with full data (ingredients, steps, images, dietary tags, nutrition data), and sample ratings/comments. `package.json` includes the Prisma seed configuration and 5 convenience `db:*` scripts.
- **User-facing changes**: None (seed data is for development/demo)
- **Developer-facing changes**: `npx prisma db seed` populates the database; `npm run db:push/migrate/seed/studio/reset` convenience scripts available

---

## Scope & Boundaries

### In Scope

- Create `prisma/seed.ts` with all seed data
- Configure `package.json` with the Prisma seed command
- Install `tsx` as a dev dependency for running TypeScript seed scripts
- Add 5 database utility scripts to `package.json`
- Seed the following data:
  - System user "RecipeApp" for seeded recipes
  - 2–3 test user accounts
  - All dietary tags (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo, Halal, Low-Carb)
  - 15–20 diverse recipes across multiple cuisines
  - Ingredients, steps, images, and dietary tags for each recipe
  - Sample ratings and comments for demo purposes

### Out of Scope

- Creating shopping list seed data
- Creating share/saved recipe seed data
- Adding AI-generated content to seed recipes

### Dependencies

- Task 2.6 (Prisma client singleton must exist; initial migration must be complete)

---

## Implementation Details

### Section 1: Install tsx and Configure Seed Command

**What to do**: Add the Prisma seed configuration to `package.json` and install `tsx`.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.15
- Prisma docs on seeding

**Specific requirements**:

- Install `tsx` as a dev dependency: `npm install -D tsx`
- Add the Prisma seed configuration to `package.json`:
  ```json
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
  ```

**Note**: ROADMAP suggests `ts-node` with CommonJS compiler options. Use `tsx` instead for cleaner ESM/TypeScript support.

---

### Section 2: Add Database Utility Scripts

**What to do**: Add 5 convenience scripts to the `scripts` section of `package.json`.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.16

**Specific requirements**:

Add the following scripts:

```json
{
  "scripts": {
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

**Script purposes**:

- `db:push` — Pushes schema to DB without creating a migration file (rapid prototyping)
- `db:migrate` — Creates and applies a new migration
- `db:seed` — Runs the seed script
- `db:studio` — Opens Prisma Studio GUI on `localhost:5555`
- `db:reset` — Resets the database (destructive — development only)

**Placement**: Add after the existing `prepare` script, grouped together.

---

### Section 3: Create Seed Script

**What to do**: Create `prisma/seed.ts` with comprehensive seed data.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.15
- [docs/SENIOR_DEVELOPER.md](docs/SENIOR_DEVELOPER.md) — Phase 8 seed outline
- `prisma/schema.prisma` — model definitions

**Specific requirements**:

#### 3a: Imports and Setup

- Import `PrismaClient` from `@prisma/client`
- Create a new `PrismaClient` instance (do NOT use the singleton from `src/lib/db.ts` — seed scripts run outside the Next.js context)
- Wrap the main logic in an async `main()` function
- Add proper error handling with disconnect in a `finally` block

#### 3b: System User

- Create a system user with:
  - `name`: "RecipeApp"
  - `username`: "recipeapp"
  - `email`: "system@recipeapp.dev"
  - `image`: a placeholder avatar URL
- Use `upsert` to make the seed script idempotent

#### 3c: Test Users

- Create 2–3 test users for development:
  - e.g., "Alice Chef" (alice_chef), "Bob Baker" (bob_baker)
  - Each with a name, username, email, and image
- Use `upsert` for idempotency

#### 3d: Dietary Tags

- Seed all dietary tags: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo, Halal, Low-Carb
- Use `upsert` (matching on `name`) for idempotency

#### 3e: Recipes (15–20)

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
  - `images`: at least one image URL per recipe (use placeholder URLs from Unsplash food category)
  - `dietaryTags`: appropriate dietary tags via `RecipeDietaryTag` + `DietaryTag`
  - `nutritionData`: pre-calculated JSON (calories, protein, carbs, fat, fiber)

#### 3f: Ratings and Comments

- Add sample ratings (2–5 per recipe) from test users
- Add sample comments (1–3 per recipe) from test users
- Update `avgRating` and `ratingCount` on each rated recipe

#### 3g: Idempotency

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
- [ ] `package.json` is valid JSON with all 5 `db:*` scripts

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
- [ ] `npm run db:push` runs without errors
- [ ] `npm run db:seed` runs without errors
- [ ] `npm run db:studio` launches Prisma Studio

### Code Quality Checks

- [ ] Seed data is realistic and diverse
- [ ] No hardcoded database IDs (use `cuid()` or let Prisma generate)
- [ ] Proper error handling with `finally` disconnect
- [ ] All 5 scripts match the ROADMAP specification
- [ ] No TODO/FIXME comments left unresolved within this task's scope

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

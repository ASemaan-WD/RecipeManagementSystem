---
task_id: 'task-2.7'
title: 'Set Up Full-Text Search'
phase: 2
task_number: 7
status: 'done'
priority: 'medium'
dependencies:
  - 'task-2.6'
blocks: []
created_at: '2026-02-18'
---

# Set Up Full-Text Search

## Current State

> Task 2.6 has run the initial migration and all tables exist in the database. The application needs PostgreSQL native full-text search capabilities on the Recipe table for searching by recipe name, description, and cuisine type.

- **What exists**: All database tables created by the initial migration; Recipe table with `name`, `description`, and `cuisineType` columns
- **What is missing**: A `searchVector` tsvector column on the Recipe table, a GIN index for fast full-text search, and a trigger to auto-update the search vector on insert/update
- **Relevant code**:
  - `prisma/schema.prisma` — Recipe model (does not include tsvector — this is added via raw SQL)
  - [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.14: raw SQL migration for tsvector, GIN index, and trigger
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — "PostgreSQL tsvector/tsquery — Native search across recipe names + ingredients, no external service"
  - [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Performance Considerations: "PostgreSQL full-text search using tsvector on recipe name + ingredient names"

---

## Desired Outcome

- **End state**: The Recipe table has a `searchVector` tsvector column with a GIN index, and a trigger that auto-updates the search vector when a recipe is inserted or updated. Full-text search queries using `ts_query` can be performed against this column.
- **User-facing changes**: None (search functionality built in Phase 7)
- **Developer-facing changes**: Full-text search infrastructure available for API routes to query against

---

## Scope & Boundaries

### In Scope

- Create a raw SQL migration to add full-text search capabilities
- Add a `searchVector` tsvector column to the Recipe table
- Create a GIN index on the `searchVector` column
- Create a trigger function to auto-update `searchVector` on INSERT/UPDATE
- Create the trigger on the Recipe table
- Test the setup with a sample query to verify it works

### Out of Scope

- Building search API routes (handled in Phase 7)
- Building search UI components (handled in Phase 7)
- Indexing ingredient names in the search vector (ingredients are in a separate table — defer to Phase 7 if needed)
- Modifying the Prisma schema to include the tsvector column (Prisma does not natively support tsvector)

### Dependencies

- Task 2.6 (Initial migration must be complete — Recipe table must exist)

---

## Implementation Details

### Section 1: Create Raw SQL Migration

**What to do**: Create a new Prisma migration using `prisma migrate dev --create-only` and then manually edit the SQL to add the full-text search infrastructure.

**Where to find context**:

- [docs/ROADMAP.md](docs/ROADMAP.md) — Task 2.14
- [docs/CTO_SPECS.md](docs/CTO_SPECS.md) — Full-text Search row in the Database table

**Specific requirements**:

1. Create an empty migration:
   ```bash
   npx prisma migrate dev --create-only --name add_full_text_search
   ```
2. Edit the generated `migration.sql` file to include:

   ```sql
   -- Add tsvector column to Recipe table
   ALTER TABLE "Recipe" ADD COLUMN "searchVector" tsvector;

   -- Create GIN index for fast full-text search
   CREATE INDEX "Recipe_searchVector_idx" ON "Recipe" USING GIN ("searchVector");

   -- Create trigger function to auto-update searchVector
   CREATE OR REPLACE FUNCTION recipe_search_vector_update() RETURNS trigger AS $$
   BEGIN
     NEW."searchVector" :=
       setweight(to_tsvector('english', COALESCE(NEW."name", '')), 'A') ||
       setweight(to_tsvector('english', COALESCE(NEW."description", '')), 'B') ||
       setweight(to_tsvector('english', COALESCE(NEW."cuisineType", '')), 'C');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Create trigger on Recipe table
   CREATE TRIGGER recipe_search_vector_trigger
     BEFORE INSERT OR UPDATE OF "name", "description", "cuisineType"
     ON "Recipe"
     FOR EACH ROW
     EXECUTE FUNCTION recipe_search_vector_update();

   -- Update existing rows (if any) to populate searchVector
   UPDATE "Recipe" SET "searchVector" =
     setweight(to_tsvector('english', COALESCE("name", '')), 'A') ||
     setweight(to_tsvector('english', COALESCE("description", '')), 'B') ||
     setweight(to_tsvector('english', COALESCE("cuisineType", '')), 'C');
   ```

3. Apply the migration:
   ```bash
   npx prisma migrate dev
   ```

**Weighting strategy**:

- Weight `A` (highest) for `name` — recipe name is the most important search field
- Weight `B` for `description` — description is secondary
- Weight `C` for `cuisineType` — cuisine type helps with browsing/filtering

**Note**: The tsvector column is NOT represented in the Prisma schema. Queries against it must use `prisma.$queryRaw` or `prisma.$executeRaw`.

---

### Section 2: Verify Full-Text Search

**What to do**: Verify the migration was applied successfully and the full-text search infrastructure works.

**Specific requirements**:

- Confirm the migration was applied without errors
- Optionally, use Prisma Studio or a raw SQL query to verify:
  - The `searchVector` column exists on the `Recipe` table
  - The GIN index exists
  - The trigger function exists
  - The trigger is attached to the Recipe table

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Migration applies without errors
- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] `npx prisma validate` still passes

### Functional Verification

- [ ] `searchVector` tsvector column exists on the Recipe table
- [ ] GIN index `Recipe_searchVector_idx` exists
- [ ] Trigger function `recipe_search_vector_update()` exists
- [ ] Trigger `recipe_search_vector_trigger` is attached to the Recipe table
- [ ] The trigger fires on INSERT and UPDATE of `name`, `description`, or `cuisineType`

### Code Quality Checks

- [ ] Migration SQL is clean and well-commented
- [ ] Weighting strategy follows the specification (A=name, B=description, C=cuisineType)
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

- **Naming discrepancy**: `SENIOR_DEVELOPER.md` (Phase 4a) uses different naming for the full-text search objects (`recipe_search_idx`, `update_recipe_search_vector()`, `recipe_search_update`) compared to this task file (`Recipe_searchVector_idx`, `recipe_search_vector_update()`, `recipe_search_vector_trigger`). This task file's naming was used as it is the source of truth. `SENIOR_DEVELOPER.md` should be updated to align in a future task.
- **Column-specific trigger**: This task's trigger uses `BEFORE INSERT OR UPDATE OF "name", "description", "cuisineType"` (column-specific) rather than the broader `BEFORE INSERT OR UPDATE ON "Recipe"` from `SENIOR_DEVELOPER.md`. The column-specific approach is more efficient as it avoids unnecessary trigger fires when unrelated columns are updated.
- **Prisma schema drift**: After applying the raw SQL migration, `npx prisma migrate dev` detects schema drift (the `searchVector` column exists in DB but not in the Prisma schema). This is expected and documented — Prisma does not natively support tsvector. Future migrations should use `npx prisma migrate dev --create-only` followed by manual application, or `npx prisma migrate deploy` in production.
- **Future consideration**: CTO_SPECS.md mentions searching "recipe name + ingredient names." The current trigger only indexes `name`, `description`, and `cuisineType` from the Recipe table directly. Indexing ingredient names would require a more complex approach (e.g., a materialized view or denormalized column). This should be evaluated during Phase 7 search implementation.

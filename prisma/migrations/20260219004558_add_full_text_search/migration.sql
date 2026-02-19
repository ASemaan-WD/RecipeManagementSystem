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

-- Add full-text search to Product table
-- This migration adds a tsvector column for fast, typo-tolerant search

-- Add search_vector column
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS product_search_vector_trigger ON "Product";
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION product_search_vector_update();

-- Update existing rows
UPDATE "Product" SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(description, '')), 'B');

-- Create GIN index for fast searching
CREATE INDEX IF NOT EXISTS product_search_vector_idx ON "Product" USING GIN (search_vector);

-- Create index for similarity search (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS product_name_trgm_idx ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_description_trgm_idx ON "Product" USING gin (description gin_trgm_ops);

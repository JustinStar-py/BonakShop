-- FILE: prisma/migrations/20250714040000_add_timestamps_to_product/migration.sql

ALTER TABLE "Product" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach the trigger to the Product table
CREATE TRIGGER update_product_updated_at
BEFORE UPDATE ON "Product"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
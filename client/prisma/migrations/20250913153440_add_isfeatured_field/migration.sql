-- FILE: prisma/migrations/xxxxxxxx_add_isfeatured_field/migration.sql

ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
-- AlterTable: Remove postalCode and province columns, add additionalPhone and createdBy
ALTER TABLE "clients" 
  DROP COLUMN IF EXISTS "postalCode",
  DROP COLUMN IF EXISTS "province",
  ADD COLUMN IF NOT EXISTS "additionalPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT;


-- AlterTable: Remove dueDate column from invoices table
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "dueDate";


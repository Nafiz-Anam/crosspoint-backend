-- AlterTable
-- Drop the existing foreign key constraint
ALTER TABLE "Token" DROP CONSTRAINT IF EXISTS "Token_employeeId_fkey";

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE "Token" ADD CONSTRAINT "Token_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;


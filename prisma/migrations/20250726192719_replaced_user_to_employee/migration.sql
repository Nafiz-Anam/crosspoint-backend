/*
  Warnings:

  - The values [MANAGE_USERS,CREATE_USER,READ_USER,UPDATE_USER,DELETE_USER] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserPermission` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `attendances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,permission]` on the table `UserPermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `UserPermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('CREATE_CLIENT', 'READ_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT', 'CREATE_SERVICE', 'READ_SERVICE', 'UPDATE_SERVICE', 'DELETE_SERVICE', 'CREATE_INVOICE', 'READ_INVOICE', 'UPDATE_INVOICE', 'DELETE_INVOICE', 'GENERATE_REPORTS', 'VIEW_REPORTS', 'CREATE_EMPLOYEE', 'READ_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE', 'MANAGE_EMPLOYEES', 'ASSIGN_PERMISSIONS');
ALTER TABLE "UserPermission" ALTER COLUMN "permission" TYPE "Permission_new" USING ("permission"::text::"Permission_new");
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "Permission_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_userId_fkey";

-- DropIndex
DROP INDEX "UserPermission_userId_permission_key";

-- DropIndex
DROP INDEX "attendances_userId_date_key";

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserPermission" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_employeeId_permission_key" ON "UserPermission"("employeeId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

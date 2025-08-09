/*
  Warnings:

  - You are about to drop the `UserPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_employeeId_fkey";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "permissions" "Permission"[];

-- DropTable
DROP TABLE "UserPermission";

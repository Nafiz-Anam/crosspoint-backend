/*
  Warnings:

  - You are about to drop the column `customerId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `clients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PENDING', 'PROCESSING', 'CANCELLED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- DropIndex
DROP INDEX "clients_customerId_key";

-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "status" SET DEFAULT 'ABSENT';

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "customerId",
DROP COLUMN "isActive",
ADD COLUMN     "assignedEmployeeId" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientId_key" ON "clients"("clientId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

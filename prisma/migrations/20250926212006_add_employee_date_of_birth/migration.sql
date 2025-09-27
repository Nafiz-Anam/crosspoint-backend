/*
  Warnings:

  - You are about to drop the column `assignedEmployeeId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `clients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nationalIdentificationNumber]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nationalIdentificationNumber]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateOfBirth` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- AlterEnum
ALTER TYPE "ClientStatus" ADD VALUE 'ACTIVE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'CREATE_TASK';
ALTER TYPE "Permission" ADD VALUE 'READ_TASK';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_TASK';
ALTER TYPE "Permission" ADD VALUE 'DELETE_TASK';
ALTER TYPE "Permission" ADD VALUE 'ASSIGN_TASK';

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_assignedEmployeeId_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_serviceId_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "assignedEmployeeId",
DROP COLUMN "serviceId",
ADD COLUMN     "nationalIdentificationNumber" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nationalIdentificationNumber" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "companyCity" TEXT,
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyPhone" TEXT,
ADD COLUMN     "companyTagline" TEXT,
ADD COLUMN     "companyWebsite" TEXT,
ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "assignedEmployeeId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskId_key" ON "tasks"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_nationalIdentificationNumber_key" ON "clients"("nationalIdentificationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nationalIdentificationNumber_key" ON "employees"("nationalIdentificationNumber");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

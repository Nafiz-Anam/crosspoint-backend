/*
  Warnings:

  - You are about to drop the column `status` on the `clients` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'CREATE_BRANCH';
ALTER TYPE "Permission" ADD VALUE 'READ_BRANCH';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BRANCH';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BRANCH';
ALTER TYPE "Permission" ADD VALUE 'CREATE_PAYMENT_METHOD';
ALTER TYPE "Permission" ADD VALUE 'READ_PAYMENT_METHOD';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_PAYMENT_METHOD';
ALTER TYPE "Permission" ADD VALUE 'DELETE_PAYMENT_METHOD';

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "status";

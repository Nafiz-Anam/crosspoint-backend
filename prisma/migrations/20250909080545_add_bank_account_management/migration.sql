/*
  Warnings:

  - You are about to drop the column `quantity` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `bankCountry` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `bankIban` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `bankSwiftCode` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'CREATE_BANK_ACCOUNT';
ALTER TYPE "Permission" ADD VALUE 'READ_BANK_ACCOUNT';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BANK_ACCOUNT';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BANK_ACCOUNT';

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "bankCountry",
DROP COLUMN "bankIban",
DROP COLUMN "bankName",
DROP COLUMN "bankSwiftCode",
ADD COLUMN     "bankAccountId" TEXT;

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCountry" TEXT NOT NULL,
    "bankIban" TEXT NOT NULL,
    "bankSwiftCode" TEXT,
    "accountName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_bankIban_key" ON "bank_accounts"("bankIban");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

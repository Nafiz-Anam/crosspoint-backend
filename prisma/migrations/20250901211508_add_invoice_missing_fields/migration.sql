/*
  Warnings:

  - The values [PENDING] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `InvoiceItem` table. All the data in the column will be lost.
  - Added the required column `description` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountAmount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotalAmount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxAmount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRate` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thanksMessage` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');
ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "price",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "bankCountry" TEXT,
ADD COLUMN     "bankIban" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankSwiftCode" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'Internet Banking',
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "subTotalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "thanksMessage" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UNPAID';

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

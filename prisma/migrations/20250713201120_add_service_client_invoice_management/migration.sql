/*
  Warnings:

  - You are about to drop the column `description` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Service` table. All the data in the column will be lost.
  - Added the required column `serviceId` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "serviceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "description",
DROP COLUMN "price";

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

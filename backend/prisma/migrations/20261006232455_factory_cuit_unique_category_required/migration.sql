/*
  Warnings:

  - A unique constraint covering the columns `[cuit]` on the table `factory_customer` will be added. If there are existing duplicate values, this will fail.
  - Made the column `categorie_id` on table `factory_customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cuit` on table `factory_customer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "factory_customer" DROP CONSTRAINT "factory_customer_categorie_id_fkey";

-- AlterTable
ALTER TABLE "factory_customer" ALTER COLUMN "cuit" SET NOT NULL,
ALTER COLUMN "categorie_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "factory_customer_cuit_key" ON "factory_customer"("cuit");

-- AddForeignKey
ALTER TABLE "factory_customer" ADD CONSTRAINT "factory_customer_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

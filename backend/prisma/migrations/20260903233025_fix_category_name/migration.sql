/*
  Warnings:

  - You are about to drop the `categorie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "factory_customer" DROP CONSTRAINT "factory_customer_categorie_id_fkey";

-- DropTable
DROP TABLE "categorie";

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "factory_customer" ADD CONSTRAINT "factory_customer_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

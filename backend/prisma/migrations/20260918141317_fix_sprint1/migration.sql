/*
  Warnings:

  - You are about to drop the column `descp` on the `supplier` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `supplier` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `supplier` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `supplier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuit]` on the table `supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `factory_customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `file` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `manager_customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `quote_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legal_name` to the `supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierType` to the `supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "category" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "factory_customer" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "manager_customer" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "quote_request" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "supplier" DROP COLUMN "descp",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "type",
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_name" VARCHAR(150),
ADD COLUMN     "contact_phone" VARCHAR(50),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cuit" VARCHAR(50),
ADD COLUMN     "legal_name" VARCHAR(80) NOT NULL,
ADD COLUMN     "supplierType" "supplier_type_enum" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "supplier_cuit_key" ON "supplier"("cuit");

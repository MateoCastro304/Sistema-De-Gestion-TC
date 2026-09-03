-- CreateEnum
CREATE TYPE "entity_type_enum" AS ENUM ('QUOTE_REQUEST', 'PART', 'QUOTE', 'WORK_ORDER');

-- CreateEnum
CREATE TYPE "document_type_enum" AS ENUM ('REQUEST_PDF', 'BLUEPRINT', 'REFERENCE_PART_PHOTO', 'DESIGN_3D', 'OTHER');

-- CreateEnum
CREATE TYPE "supplier_type_enum" AS ENUM ('PROCESS', 'REPLACEMENT', 'MATERIAL', 'PAINT');

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s3_bucket" VARCHAR(255) NOT NULL,
    "s3_key" VARCHAR(1024) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "extension" VARCHAR(10) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "document_type" "document_type_enum" NOT NULL,
    "entity_type" "entity_type_enum" NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorie" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_customer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "cuit" VARCHAR(50),
    "pay_method" VARCHAR(255),
    "categorie_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "factory_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_customer" (
    "id" INTEGER NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50),
    "phone" VARCHAR(50),
    "mail" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "manager_customer_pkey" PRIMARY KEY ("factory_id","id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "type" "supplier_type_enum" NOT NULL,
    "name" VARCHAR(150),
    "address" VARCHAR(255),
    "phone" VARCHAR(50),
    "descp" VARCHAR(255),
    "observation" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_request" (
    "id" SERIAL NOT NULL,
    "manager_customer_id" INTEGER NOT NULL,
    "manager_factory_id" INTEGER NOT NULL,
    "descp" VARCHAR(200),
    "req_date" DATE NOT NULL,
    "order_number" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quote_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_s3_key_key" ON "file"("s3_key");

-- AddForeignKey
ALTER TABLE "factory_customer" ADD CONSTRAINT "factory_customer_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_customer" ADD CONSTRAINT "manager_customer_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factory_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request" ADD CONSTRAINT "quote_request_manager_factory_id_manager_customer_id_fkey" FOREIGN KEY ("manager_factory_id", "manager_customer_id") REFERENCES "manager_customer"("factory_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

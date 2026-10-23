/*
  Warnings:

  - You are about to drop the column `categorie_id` on the `factory_customer` table. All the data in the column will be lost.
  - Made the column `name` on table `category` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category_id` to the `factory_customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "role_enum" AS ENUM ('JT', 'ERP', 'EC', 'ER', 'AT', 'AS');

-- CreateEnum
CREATE TYPE "employee_position_enum" AS ENUM ('ADMINISTRATION', 'WORKSHOP_HEAD', 'HEAD', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "session_end_reason_enum" AS ENUM ('MANUAL', 'INACTIVITY', 'EXPIRED', 'REVOKED');

-- DropForeignKey
ALTER TABLE "factory_customer" DROP CONSTRAINT "factory_customer_categorie_id_fkey";

-- AlterTable
ALTER TABLE "category" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "factory_customer" DROP COLUMN "categorie_id",
ADD COLUMN     "category_id" INTEGER NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "file" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "manager_customer" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "quote_request" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "supplier" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "position" "employee_position_enum" NOT NULL,
    "address" VARCHAR(200),
    "email" VARCHAR(120),
    "phone" VARCHAR(50),
    "search_key" VARCHAR(201) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "blocked_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" INTEGER NOT NULL,
    "role" "role_enum" NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "user_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "end_reason" "session_end_reason_enum",

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" CHAR(64) NOT NULL,
    "session_id" UUID NOT NULL,
    "replaced_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_key" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "hourly_rate_ars" DECIMAL(12,2) NOT NULL,
    "hourly_rate_usd" DECIMAL(12,2) NOT NULL,
    "exchange_rate" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_type_price_history" (
    "id" SERIAL NOT NULL,
    "process_type_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by_user_id" INTEGER NOT NULL,
    "exchange_rate" DECIMAL(12,2) NOT NULL,
    "previous_value_usd" DECIMAL(12,2) NOT NULL,
    "new_value_usd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "process_type_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "quality" VARCHAR(60) NOT NULL,
    "name_key" VARCHAR(60) NOT NULL,
    "quality_key" VARCHAR(60) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "rate" DECIMAL(12,2) NOT NULL,
    "quoted_at" TIMESTAMPTZ(6) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_dni_key" ON "employee"("dni");

-- CreateIndex
CREATE INDEX "employee_last_name_first_name_idx" ON "employee"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_employee_id_key" ON "app_user"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- CreateIndex
CREATE INDEX "user_role_role_idx" ON "user_role"("role");

-- CreateIndex
CREATE INDEX "user_session_user_id_started_at_idx" ON "user_session"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "user_session_expires_at_idx" ON "user_session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_replaced_by_key" ON "refresh_token"("replaced_by");

-- CreateIndex
CREATE INDEX "refresh_token_session_id_idx" ON "refresh_token"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "process_type_name_key_key" ON "process_type"("name_key");

-- CreateIndex
CREATE INDEX "process_type_price_history_process_type_id_changed_at_id_idx" ON "process_type_price_history"("process_type_id", "changed_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "material_name_key_quality_key_key" ON "material"("name_key", "quality_key");

-- CreateIndex
CREATE INDEX "factory_customer_category_id_idx" ON "factory_customer"("category_id");

-- CreateIndex
CREATE INDEX "quote_request_manager_factory_id_manager_customer_id_idx" ON "quote_request"("manager_factory_id", "manager_customer_id");

-- AddForeignKey
ALTER TABLE "factory_customer" ADD CONSTRAINT "factory_customer_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_replaced_by_fkey" FOREIGN KEY ("replaced_by") REFERENCES "refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_type" ADD CONSTRAINT "process_type_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_type_price_history" ADD CONSTRAINT "process_type_price_history_process_type_id_fkey" FOREIGN KEY ("process_type_id") REFERENCES "process_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_type_price_history" ADD CONSTRAINT "process_type_price_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

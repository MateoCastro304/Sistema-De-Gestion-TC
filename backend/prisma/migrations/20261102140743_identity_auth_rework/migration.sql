/*
  Identity rework: roles as tables, temporary login lockout.

  - role_enum becomes the role / permission / role_permission tables.
    user_role.role is converted to user_role.role_id, keeping existing rows.
  - app_user loses failed_login_attempts and blocked_at. The lockout lives in
    login_attempt (keyed by identifier, no FK to app_user).

  Dropped data: the two app_user columns above. The lockout state they held
  is not carried over (permanent blocks are replaced by temporary ones).
*/

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "description" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "login_attempt" (
    "identifier" VARCHAR(120) NOT NULL,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "last_failed_at" TIMESTAMPTZ(6) NOT NULL,
    "locked_until" TIMESTAMPTZ(6),

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("identifier")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_code_key" ON "role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "permission"("code");

-- CreateIndex
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission"("permission_id");

-- CreateIndex
CREATE INDEX "login_attempt_last_failed_at_idx" ON "login_attempt"("last_failed_at");

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Seed: roles (same order as the former role_enum) ─────────────
INSERT INTO "role" ("code", "name", "sort_order") VALUES
    ('JT',  'Jefe de Taller',            1),
    ('ERP', 'Encargado de Recepción',    2),
    ('EC',  'Encargado de Cotización',   3),
    ('ER',  'Encargado de Reportes',     4),
    ('AT',  'Administrativo Técnico',    5),
    ('AS',  'Administrador del Sistema', 6);

-- ── Seed: permissions (Sprint 2 scope, docs/dominio/07-matriz-rbac.md) ──
INSERT INTO "permission" ("code", "description") VALUES
    ('customer:manage',      'ABMC de encargados de cliente'),
    ('factory:manage',       'ABMC de fábricas'),
    ('category:manage',      'ABMC de rubros'),
    ('quote-request:manage', 'Registrar solicitudes de cotización'),
    ('user:manage',          'ABMC de usuarios y asignación de roles'),
    ('employee:manage',      'ABMC de empleados'),
    ('process-type:manage',  'ABMC de tipos de proceso'),
    ('supplier:manage',      'ABMC de proveedores'),
    ('material:manage',      'ABMC de materiales');

-- ── Seed: role → permission. EC inherits everything AT has (principio 3). ──
INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM (VALUES
    ('ERP', 'customer:manage'),
    ('ERP', 'factory:manage'),
    ('ERP', 'category:manage'),
    ('ERP', 'quote-request:manage'),
    ('AS',  'user:manage'),
    ('AS',  'employee:manage'),
    ('AT',  'process-type:manage'),
    ('AT',  'supplier:manage'),
    ('AT',  'material:manage'),
    ('EC',  'process-type:manage'),
    ('EC',  'supplier:manage'),
    ('EC',  'material:manage')
) AS m ("role_code", "permission_code")
JOIN "role" r       ON r."code" = m."role_code"
JOIN "permission" p ON p."code" = m."permission_code";

-- ── user_role: role_enum column -> role_id, keeping existing rows ──
ALTER TABLE "user_role" ADD COLUMN "role_id" INTEGER;

UPDATE "user_role" ur
SET "role_id" = r."id"
FROM "role" r
WHERE r."code" = ur."role"::text;

ALTER TABLE "user_role" ALTER COLUMN "role_id" SET NOT NULL;

-- DropIndex
DROP INDEX "user_role_role_idx";

-- AlterTable
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey",
DROP COLUMN "role",
ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id", "role_id");

-- DropEnum
DROP TYPE "role_enum";

-- CreateIndex
CREATE INDEX "user_role_role_id_idx" ON "user_role"("role_id");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── app_user: lockout moves to login_attempt ───────────────────
ALTER TABLE "app_user" DROP CONSTRAINT IF EXISTS "ck_app_user_failed_attempts";

-- AlterTable
ALTER TABLE "app_user" DROP COLUMN "blocked_at",
DROP COLUMN "failed_login_attempts";

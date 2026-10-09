-- Proveedores: alinea la tabla con las reglas del dominio.
--
--  1. `supplierType` habia quedado en camelCase cuando el resto del schema usa
--     snake_case. Se renombra con RENAME COLUMN y no con DROP + ADD (que es lo
--     que genera Prisma solo) para no perder el dato.
--
--  2. La unicidad de `cuit` pasa a valer solo entre los proveedores activos, y
--     se agrega la misma regla para `legal_name` sin distinguir mayusculas.
--     La baja es logica y no hay reactivacion, asi que un proveedor inactivo no
--     tiene que bloquear para siempre su CUIT ni su razon social: dado de baja
--     "EDASA" con CUIT 30-11111111-1, se tiene que poder registrar "OxyCam" con
--     ese mismo CUIT sin revivir al anterior.
--
--     Son indices parciales (WHERE) y funcionales (LOWER), que Prisma no sabe
--     expresar en el schema. Por eso van escritos a mano aca y `cuit` ya no
--     lleva @unique en schema.prisma. Verificado: Prisma no los ve al calcular
--     el diff, asi que no los va a proponer para borrar.
--
--     `cuit` es nullable y en Postgres los NULL no colisionan entre si, asi que
--     varios proveedores activos sin CUIT siguen conviviendo sin problema.

-- AlterTable
ALTER TABLE "supplier" RENAME COLUMN "supplierType" TO "supplier_type";

-- DropIndex
DROP INDEX "supplier_cuit_key";

-- CreateIndex
CREATE UNIQUE INDEX "supplier_cuit_active_key"
    ON "supplier" ("cuit")
    WHERE "is_active";

-- CreateIndex
CREATE UNIQUE INDEX "supplier_legal_name_active_key"
    ON "supplier" (LOWER("legal_name"))
    WHERE "is_active";

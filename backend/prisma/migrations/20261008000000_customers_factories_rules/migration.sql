-- CUIT unico solo entre fabricas activas. Una fabrica dada de baja no bloquea
-- el alta de otra con el mismo CUIT: pueden coexistir una activa y varias inactivas.
DROP INDEX IF EXISTS "factory_customer_cuit_key";
CREATE UNIQUE INDEX "factory_customer_cuit_active_key"
  ON "factory_customer"("cuit")
  WHERE "is_active" = true;

-- Nombre de fabrica unico entre activas, sin distinguir mayusculas.
CREATE UNIQUE INDEX "factory_customer_name_active_key"
  ON "factory_customer"(lower("name"))
  WHERE "is_active" = true;

-- Mail unico por fabrica entre encargados activos.
CREATE UNIQUE INDEX "manager_customer_mail_active_key"
  ON "manager_customer"("factory_id", lower("mail"))
  WHERE "is_active" = true AND "mail" IS NOT NULL;

-- El id del encargado lo calcula el repositorio (max + 1): el trigger nunca se usa.
DROP TRIGGER IF EXISTS trg_gen_id_manager ON "manager_customer";
DROP FUNCTION IF EXISTS fn_gen_id_manager();

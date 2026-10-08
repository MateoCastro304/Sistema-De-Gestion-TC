-- El CUIT deja de ser unico global: solo debe ser unico entre fabricas activas.
-- Una fabrica dada de baja (is_active = false) no bloquea el alta de otra con el
-- mismo CUIT, por lo que pueden coexistir una activa y varias inactivas.
DROP INDEX "factory_customer_cuit_key";

CREATE UNIQUE INDEX "factory_customer_cuit_active_key"
  ON "factory_customer"("cuit")
  WHERE "is_active" = true;

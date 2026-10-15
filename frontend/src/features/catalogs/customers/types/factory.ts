/**
 * FabricaCliente: the industrial company a contact (EncargadoCliente) belongs
 * to. Fields come from the ERS use cases CU-58..61 and the business rule
 * "Gestión de clientes": nombre, dirección, CUIT, formas de pago y rubro.
 *
 * PENDIENTE: el código de fábrica (`code`, único, obligatorio, 2 a 4
 * caracteres) todavía no existe en la base ni en el backend, así que se dejó
 * afuera. Ver docs/decisions/decisiones-clientes-fabricas.md, sección 5.
 *
 * One factory can have several contacts. `payMethod` is free text
 * ("descripcionPago" of the domain model, DB column `factory_customer.pay_method`),
 * not a fixed list of methods.
 */
export interface Factory {
  id: string
  name: string
  /** Argentine CUIT, stored as 11 digits (may be shown formatted). Required and unique. */
  cuit: string
  /** Optional: `''` when absent. */
  address: string
  /** Optional free text: `''` when absent. */
  payMethod: string
  /** Id of the rubro (backend category), as a string. Required. */
  categoryId: string
  /** Logical-delete flag (baja lógica, CU-61). */
  isActive: boolean
}

/** Payload sent to the API on create/update. */
export interface FactoryInput {
  name: string
  cuit: string
  address: string
  payMethod: string
  categoryId: string
}

/**
 * FabricaCliente: the industrial company a contact (EncargadoCliente) belongs
 * to. Fields come from the ERS use cases CU-58..61 and the business rule
 * "Gestión de clientes": nombre, dirección, CUIT, formas de pago y rubro.
 *
 * One factory can have several contacts. `paymentDescription` is free text
 * ("descripcionPago" of the domain model), not a fixed list of methods.
 */
export interface Factory {
  id: string
  name: string
  /** Argentine CUIT, stored as 11 digits (may be shown formatted). */
  cuit: string
  address: string
  paymentDescription: string
  industryId: string
  /** Logical-delete flag (baja lógica, CU-61). */
  isActive: boolean
}

/** Payload sent to the API on create/update. */
export interface FactoryInput {
  name: string
  cuit: string
  address: string
  paymentDescription: string
  industryId: string
}

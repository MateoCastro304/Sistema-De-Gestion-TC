/**
 * FabricaCliente: the industrial company a contact (EncargadoCliente) belongs
 * to. Fields come from the ERS use cases CU-58..61 and the business rule
 * "Gestión de clientes": nombre, dirección, CUIT, formas de pago y rubro.
 *
 * One factory can have several contacts. `payMethod` is free text
 * ("descripcionPago" of the domain model, DB column `factory_customer.pay_method`),
 * not a fixed list of methods.
 */
export interface Factory {
  id: string
  name: string
  /**
   * Unique factory code (3–4 chars), used as the prefix of the internal
   * sequential id of pieces that arrive without a plan number (ERS §2.3).
   * Stored uppercased.
   */
  code: string
  /** Argentine CUIT, stored as 11 digits (may be shown formatted). */
  cuit: string
  address: string
  payMethod: string
  industryId: string
  /** Logical-delete flag (baja lógica, CU-61). */
  isActive: boolean
}

/** Payload sent to the API on create/update. */
export interface FactoryInput {
  name: string
  code: string
  cuit: string
  address: string
  payMethod: string
  industryId: string
}

/**
 * Domain type for the Customer catalog (ERS "Cliente" = EncargadoCliente).
 *
 * The ABMC is about the *contact person* who requests quotes, not the company.
 * Fields come from CU-01 "Registrar Cliente" and the business rule "Gestión de
 * clientes: encargados y fábricas":
 *   nombre, apellido, teléfono, mail y la fábrica a la que pertenece.
 *
 * The company data (nombre, CUIT, dirección, forma de pago, rubro) lives in
 * {@link ./factory.ts Factory}; a contact references it by `factoryId`. One
 * factory can have several contacts.
 */

/** "Lo que recibo" - forma completa de un cliente, tal como llega del backend */
export interface Customer {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  /** FabricaCliente this contact belongs to. */
  factoryId: string
  /** Logical-delete flag (baja lógica, CU-04). */
  isActive: boolean
}

/**
 * Payload sent to the API on create/update. Server-generated fields (id,
 * isActive) are left out.
 */

/** "Lo que envío" - forma de un cliente para crear o actualizar */
export interface CustomerInput {
  firstName: string
  lastName: string
  phone: string
  email: string
  factoryId: string
}

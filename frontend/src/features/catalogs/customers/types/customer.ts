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
  /**
   * Per-factory manager id. In the DB (`manager_customer`) the primary key is
   * composite `(factory_id, id)` and `id` restarts from 1 for each factory, so
   * it is unique only together with {@link factoryId}. Always address a customer
   * by the `(factoryId, id)` pair, never by `id` alone.
   */
  id: string
  firstName: string
  lastName: string
  /**
   * Phone / WhatsApp number. Optional at the domain level (DB column
   * `manager_customer.phone` is nullable): at least one of `phone` / `mail`
   * must be present, enforced by the form and the API, not by this type.
   */
  phone: string
  /**
   * Whether {@link phone} accepts WhatsApp, the channel used to send the quote
   * report (CU-21). No DB column yet (frontend-ahead field).
   */
  hasWhatsapp: boolean
  /**
   * Contact email. Named `mail` to match the DB column `manager_customer.mail`
   * (nullable). Conditional: at least one of `mail` / `phone` is required.
   */
  mail: string
  /** Free-text notes. No DB column yet (frontend-ahead field). */
  observation: string
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
  hasWhatsapp: boolean
  mail: string
  observation: string
  factoryId: string
}

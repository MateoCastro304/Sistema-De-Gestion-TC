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
  /** Optional (DB `last_name` is nullable): the backend answers `''` when absent. */
  lastName: string
  /** Optional: `''` when absent. At least one of `phone` / `mail` is required. */
  phone: string
  /** Optional: `''` when absent. At least one of `mail` / `phone` is required. */
  mail: string
  /** FabricaCliente this contact belongs to. */
  factoryId: string
  /** Logical-delete flag (baja lógica, CU-04). */
  isActive: boolean
}

/**
 * Filtros del listado (`GET /customers`). Todos opcionales y combinables; el
 * backend filtra y pagina del lado del servidor (DTC-54). `factoryId` acota a
 * una fábrica (sección "encargados de la fábrica"); `nameContains` busca por
 * nombre o apellido; `active` deja solo activos (`true`) o solo inactivos
 * (`false`) —omitirlo trae ambos—. `page`/`limit` controlan la paginación.
 */
export interface CustomerListParams {
  page?: number
  limit?: number
  factoryId?: string
  nameContains?: string
  active?: boolean
}

/**
 * "Lo que envío" - forma de un cliente para crear o actualizar. `factoryId`
 * sirve para armar la URL; no viaja en el cuerpo del pedido.
 */
export interface CustomerInput {
  firstName: string
  lastName: string
  phone: string
  mail: string
  factoryId: string
}

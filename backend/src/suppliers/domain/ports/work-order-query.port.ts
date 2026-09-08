// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

/**
 * Secondary port used by the Suppliers module to ask about work orders without
 * depending on that module directly. Read-only on purpose: suppliers can only
 * query the state of orders, never create or modify them. Implementations live
 * outside this module (a real adapter once WorkOrders exists, a stub meanwhile).
 */
export abstract class WorkOrderQuery {
  /**
   * Whether the supplier is currently referenced by at least one work order
   * that is not in a final state. Used by the deactivate use case to enforce
   * the 409 rule from the OpenAPI.
   */
  abstract hasOpenOrdersForSupplier(supplierId: number): Promise<boolean>;
}

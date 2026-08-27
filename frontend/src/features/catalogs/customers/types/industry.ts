/**
 * Rubro (business sector) a factory belongs to. In the ERS it is its own
 * catalog (CU-41..44); here it is managed inline from the factory form
 * ("desde las fábricas los rubros"). The seed data includes a special
 * "Particular" rubro used for individual (non-company) customers.
 */
export interface Industry {
  id: string
  name: string
  /** Logical-delete flag. */
  isActive: boolean
}

/** Payload sent to the API on create. */
export interface IndustryInput {
  name: string
}

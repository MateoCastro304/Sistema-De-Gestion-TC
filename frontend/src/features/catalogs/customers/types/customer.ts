/**
 * Domain types for the Customer catalog (ERS "Cliente").
 *
 * A customer is an industrial factory that requests work (EDASA, OxyCAM, ...).
 * The fields come straight from the ERS: use case CU-01 "Registrar Cliente" and
 * the business rule "Gestión de clientes":
 *   nombre, tipo de persona, dirección, mails, formas de pago y rubro.
 * The domain model also lists a phone, kept here as optional.
 */

/** Persona física / jurídica. */
export type PersonType = 'individual' | 'business'

/** Options for the person-type selector, with Spanish labels for the UI. */
export const PERSON_TYPE_OPTIONS: ReadonlyArray<{
  value: PersonType
  label: string
}> = [
  { value: 'individual', label: 'Persona física' },
  { value: 'business', label: 'Persona jurídica' },
]

/** Human-readable label for a person type (used in tables/detail). */
export const PERSON_TYPE_LABEL: Record<PersonType, string> = {
  individual: 'Persona física',
  business: 'Persona jurídica',
}

/**
 * Rubro: the business sector the customer belongs to. It is its own catalog in
 * the ERS (CU-41..44) and is referenced here by id. Until that catalog has its
 * own feature, the options are served by the same mock layer.
 */
export interface Industry {
  id: string
  name: string
}

/** A customer as returned by the API. */
export interface Customer {
  id: string
  name: string
  personType: PersonType
  address: string
  /** Optional in the domain model; not required by CU-01. */
  phone?: string
  emails: string[]
  /**
   * Free-text notes about how the customer pays ("descripcionPago" in the
   * domain model). Not a fixed list of methods: the user writes clarifications,
   * e.g. "cliente puntual, suele pagar adelantado, casi siempre transferencia".
   */
  paymentDescription: string
  industryId: string
  /** Logical-delete flag (baja lógica, CU-04). */
  isActive: boolean
}

/**
 * Payload sent to the API on create/update. Server-generated fields (id,
 * isActive, payment-method ids) are left out.
 */
export interface CustomerInput {
  name: string
  personType: PersonType
  address: string
  phone?: string
  emails: string[]
  paymentDescription: string
  industryId: string
}

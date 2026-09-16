import { Customer } from '../customer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Filters for a paginated listing. Only page and limit are required; the rest
 * are optional and, when present, are AND-combined. An absent filter is
 * ignored.
 */
export type CustomerListParams = {
  page: number;
  limit: number;
  factoryId?: number;
  // Case-insensitive partial match on name or lastName.
  nameContains?: string;
  active?: boolean;
};

/** A page of customers together with the total count matching the filter. */
export type CustomerListResult = {
  items: Customer[];
  total: number;
};

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

/**
 * Persistence contract for the Customer aggregate. Declared as an abstract
 * class so it works as both the TypeScript type and the Nest DI token,
 * without pulling framework code into the domain. Implementations live in
 * the infrastructure layer.
 */
export abstract class CustomerRepository {
  abstract findAll(): Promise<Customer[]>;
  abstract findById(id: number): Promise<Customer | null>;
  abstract save(customer: Customer): Promise<Customer>;
  abstract update(customer: Customer): Promise<void>;

  /**
   * Whether any customer already uses this mail. excludeId lets the update
   * flow skip the record being modified so it does not clash with itself.
   */
  abstract existsByMail(mail: string, excludeId?: number): Promise<boolean>;

  /**
   * Paginated listing driven by {@link CustomerListParams}. The result
   * carries the total count so the client can render pagination without a
   * second round-trip.
   */
  abstract list(params: CustomerListParams): Promise<CustomerListResult>;
}

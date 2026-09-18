import { Cuit } from '../../../shared/domain/cuit';
import { Supplier } from '../supplier';
import { SupplierType } from '../supplier-type';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Filters for a paginated listing. Only page and limit are required; the rest
 * are optional and, when present, are AND-combined. An absent filter is
 * ignored.
 */
export type SupplierListParams = {
  page: number;
  limit: number;
  // Matches suppliers that carry at least one of the given types.
  types?: SupplierType[];
  // Case-insensitive partial match on legalName.
  legalNameContains?: string;
};

/** A page of suppliers together with the total count matching the filter. */
export type SupplierListResult = {
  items: Supplier[];
  total: number;
};

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

/**
 * Persistence contract for the Supplier aggregate. Declared as an abstract
 * class so it works as both the TypeScript type and the Nest DI token, without
 * pulling framework code into the domain. Implementations live in the
 * infrastructure layer.
 */
export abstract class SupplierRepository {
  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Loads a supplier by id regardless of its active state. Whether an inactive
   * record is a valid answer is a decision of the calling use case, not of the
   * repository.
   */
  abstract findById(id: number): Promise<Supplier | null>;

  /**
   * Whether any supplier — active or inactive — already uses this CUIT.
   * Uniqueness is enforced across all rows, per the 409 rule in the OpenAPI.
   * excludeId lets the update flow skip the record being modified so it does
   * not clash with itself.
   */
  abstract existsByCuit(cuit: Cuit, excludeId?: number): Promise<boolean>;

  /** Same rule as {@link existsByCuit}, applied to the legal name. */
  abstract existsByLegalName(legalName: string, excludeId?: number): Promise<boolean>;

  /**
   * Paginated listing driven by {@link SupplierListParams}. The result carries
   * the total count so the client can render pagination without a second
   * round-trip.
   */
  abstract list(params: SupplierListParams): Promise<SupplierListResult>;

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  /**
   * Persists the aggregate. Insert when getId() is null, update otherwise;
   * choosing the operation is the adapter's job, not the caller's. Returns the
   * persisted supplier with the assigned id on creates.
   */
  abstract save(supplier: Supplier): Promise<Supplier>;
}

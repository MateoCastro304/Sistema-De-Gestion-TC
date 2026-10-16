import { Cuit } from '../../../../../shared/domain/cuit';
import { Supplier } from '../entities/supplier';
import { SupplierType } from '../value-objects/supplier-type';

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
  // Exact match on the supplier's single type.
  type?: SupplierType;
  /**
   * Free-text search. Matches a case-insensitive substring of the legalName or
   * the contactName, or a substring of the cuit. For the cuit the separators
   * are stripped from both sides before comparing, so "30-712" finds the
   * supplier stored as "30712345671".
   *
   * One field instead of one filter per column because the UI is a single
   * search box: the user types and does not pick which column to look at.
   */
  search?: string;
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
   * Whether an **active** supplier already uses this CUIT.
   *
   * Uniqueness deliberately ignores inactive rows: the baja is logical and
   * there is no reactivation, so a supplier that was dado de baja must not
   * block its CUIT forever. Deactivate "EDASA" with CUIT 30-11111111-1 and
   * registering "OxyCam" with that same CUIT has to succeed, without reviving
   * the old record.
   *
   * excludeId lets the update flow skip the record being modified so it does
   * not clash with itself.
   *
   * Mirrors the partial index `supplier_cuit_active_key`
   * (UNIQUE (cuit) WHERE is_active). Keep both in sync: if this method ever
   * looks at inactive rows again, the application would answer 409 where the
   * database would happily accept the insert.
   */
  abstract existsByCuit(cuit: Cuit, excludeId?: number): Promise<boolean>;

  /**
   * Same active-only rule as {@link existsByCuit}, applied to the legal name,
   * and additionally **case-insensitive**: "Proveedor" and "PROVEEDOR" are the
   * same legal name.
   *
   * Mirrors the index `supplier_legal_name_active_key`
   * (UNIQUE (LOWER(legal_name)) WHERE is_active).
   */
  abstract existsByLegalName(legalName: string, excludeId?: number): Promise<boolean>;

  /**
   * Paginated listing driven by {@link SupplierListParams}. Returns **only
   * active suppliers**: the baja is logical, but a supplier dado de baja stops
   * existing for every query, so there is no flag to include them. The result
   * carries the total count so the client can render pagination without a
   * second round-trip.
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

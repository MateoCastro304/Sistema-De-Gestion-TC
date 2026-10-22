import { Manager } from '../entities/manager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Filters for a paginated listing. Only page and limit are required; the rest
 * are optional and, when present, are AND-combined. An absent filter is
 * ignored.
 */
export type ManagerListParams = {
  page: number;
  limit: number;
  factoryId?: number;
  // Case-insensitive partial match on name or lastName.
  nameContains?: string;
  active?: boolean;
};

/** A page of managers together with the total count matching the filter. */
export type ManagerListResult = {
  items: Manager[];
  total: number;
};

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

/**
 * Persistence contract for the Manager aggregate. Declared as an abstract
 * class so it works as both the TypeScript type and the Nest DI token,
 * without pulling framework code into the domain. Implementations live in
 * the infrastructure layer.
 */
export abstract class ManagerRepository {
  abstract findAll(): Promise<Manager[]>;
  abstract findById(factoryId: number, id: number): Promise<Manager | null>;
  abstract save(manager: Manager): Promise<Manager>;
  abstract update(manager: Manager): Promise<void>;

  /**
   * Whether any ACTIVE manager of that factory already uses this mail (los dados de baja
   * se ignoran). excludeId
   * lets the update flow skip the record being modified.
   */
  abstract existsByMail(mail: string, factoryId: number, excludeId?: number): Promise<boolean>;

  abstract list(params: ManagerListParams): Promise<ManagerListResult>;
}

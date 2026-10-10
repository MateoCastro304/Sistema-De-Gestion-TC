import { Injectable } from '@nestjs/common';
import { SupplierListResult, SupplierRepository } from '../domain/ports/supplier.repository';
import { SupplierType } from '../domain/supplier-type';

export type ListSuppliersInput = {
  page: number;
  limit: number;
  type?: SupplierType;
  search?: string;
};

/**
 * Returns a paginated list of active suppliers, optionally narrowed by type
 * and by a free-text search. The type filter is exclusive: a supplier carries
 * a single type, so asking for MATERIAL returns only those. The search matches
 * legalName, contactName or cuit.
 *
 * Returns the total alongside the page so the client can paginate without
 * guessing: the whole result set is never shipped at once.
 *
 * The use case is a thin adapter over {@link SupplierRepository.list}; it
 * exists as the seam where controllers plug in, tests mock, and future
 * application-level rules (e.g. per-user scoping) will land.
 */
@Injectable()
export class ListSuppliers {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: ListSuppliersInput): Promise<SupplierListResult> {
    return await this.repo.list(input);
  }
}

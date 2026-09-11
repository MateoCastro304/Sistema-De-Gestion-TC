import { Injectable } from '@nestjs/common';
import { SupplierListResult, SupplierRepository } from '../domain/ports/supplier.repository';
import { SupplierType } from '../domain/supplier-type';

export type ListSuppliersInput = {
  page: number;
  limit: number;
  types?: SupplierType[];
  legalNameContains?: string;
};

/**
 * Returns a paginated list of suppliers, optionally filtered by supplier type
 * and legal-name substring. The use case is a thin adapter over
 * {@link SupplierRepository.list}; it exists as the seam where controllers
 * plug in, tests mock, and future application-level rules (e.g. per-user
 * scoping) will land.
 */
@Injectable()
export class ListSuppliers {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: ListSuppliersInput): Promise<SupplierListResult> {
    return await this.repo.list(input);
  }
}

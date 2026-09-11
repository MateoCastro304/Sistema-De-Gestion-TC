import { Injectable } from '@nestjs/common';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';
import { SupplierRepository } from '../domain/ports/supplier.repository';
import { Supplier } from '../domain/supplier';

/**
 * Loads a supplier by its identifier or fails with {@link SupplierNotFound}.
 * The port returns null when the record is missing; turning that null into a
 * domain error is a use-case decision, not a repository one. This "load or
 * throw" shape is shared with UpdateSupplier.
 */
@Injectable()
export class GetSupplierById {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: number): Promise<Supplier> {
    const supplier = await this.repo.findById(id);
    if (supplier === null) {
      throw new SupplierNotFound(id);
    }

    return supplier;
  }
}

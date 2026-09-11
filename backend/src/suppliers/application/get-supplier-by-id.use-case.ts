import { Injectable } from '@nestjs/common';
import { SupplierRepository } from '../domain/ports/supplier.repository';
import { Supplier } from '../domain/supplier';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';

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

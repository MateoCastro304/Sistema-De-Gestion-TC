import { Injectable } from '@nestjs/common';
import { SupplierRepository } from '../domain/ports/supplier.repository';
import { Supplier } from '../domain/supplier';
import { SupplierType } from '../domain/supplier-type';
import { SupplierAlreadyExists } from '../domain/errors/supplier-already-exists.error';
import { Cuit } from '../domain/cuit';

export type CreateSupplierInput = {
  legalName: string;
  supplierTypes: SupplierType[];
  cuit?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

/**
 * Registers a new supplier. Enforces the OpenAPI 409 rule for cuit and
 * legalName uniqueness across active and inactive rows before delegating
 * construction to {@link Supplier.create}, whose invariants and value-object
 * validation propagate as 400 errors on invalid input.
 */
@Injectable()
export class CreateSupplier {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    const legalName = input.legalName.trim();
    const cuit = input.cuit == null ? null : Cuit.create(input.cuit);

    if (await this.repo.existsByLegalName(legalName)) {
      throw new SupplierAlreadyExists('legalName', legalName);
    }

    if (cuit && (await this.repo.existsByCuit(cuit))) {
      throw new SupplierAlreadyExists('cuit', cuit.getCuitValue());
    }

    const supplier = Supplier.create(legalName, input.supplierTypes, {
      cuit: input.cuit,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
    });

    return await this.repo.save(supplier);
  }
}

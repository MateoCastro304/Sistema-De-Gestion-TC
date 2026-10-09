import { Injectable } from '@nestjs/common';
import { Cuit } from '../../shared/domain/cuit';
import { SupplierAlreadyExists } from '../domain/errors/supplier-already-exists.error';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';
import { SupplierRepository } from '../domain/ports/supplier.repository';
import { Supplier } from '../domain/supplier';

/**
 * Fields accepted by a partial update. Each optional key has three meaningful
 * states: absent means "leave the field untouched", null (where allowed) means
 * "clear it", and a value means "replace it". supplierType is deliberately
 * excluded because it is immutable by design, and there is no reactivation, so
 * active is not accepted either.
 */
export type UpdateSupplierInput = {
  legalName?: string;
  cuit?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  observation?: string | null;
};

/**
 * Applies a partial change set to an existing supplier. Enforces the 409 rule
 * for cuit and legalName among the active suppliers, excluding the supplier
 * being updated so it does not clash with itself. Every domain
 * invariant is applied inside {@link Supplier.update}, which builds and
 * validates the new state before assigning, so a rejected payload leaves the
 * aggregate untouched.
 */
@Injectable()
export class UpdateSupplier {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: number, input: UpdateSupplierInput): Promise<Supplier> {
    // An inactive supplier is a 404, not a 409: it stopped existing for every
    // consumer, so there is nothing to modify.
    const supplier = await this.repo.findById(id);
    if (supplier === null || !supplier.getActive()) {
      throw new SupplierNotFound(id);
    }

    // Building the Cuit VO here does double duty: it validates the format
    // (so a malformed value propagates as a 400 before hitting the repo) and
    // gives us the type the port expects for the uniqueness check.
    if (typeof input.cuit === 'string') {
      const cuit = Cuit.create(input.cuit);
      if (await this.repo.existsByCuit(cuit, id)) {
        throw new SupplierAlreadyExists('cuit', cuit.getCuitValue());
      }
    }

    // Trim once and reuse for both the uniqueness check and the entity update.
    const trimmedLegalName = input.legalName?.trim();
    if (trimmedLegalName !== undefined) {
      if (await this.repo.existsByLegalName(trimmedLegalName, id)) {
        throw new SupplierAlreadyExists('legalName', trimmedLegalName);
      }
    }

    supplier.update({
      ...input,
      legalName: trimmedLegalName,
    });

    return await this.repo.save(supplier);
  }
}

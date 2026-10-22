import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export type SupplierUniqueField = 'cuit' | 'legalName';

/**
 * Raised when a create or update would leave two suppliers sharing the same
 * cuit or legalName. Uniqueness is enforced across active and inactive rows,
 * per the OpenAPI 409 rule. The offending field and value travel as public
 * readonly fields so the exception filter can render a precise 409 body.
 */
export class SupplierAlreadyExists extends DomainError {
  constructor(
    public readonly field: SupplierUniqueField,
    public readonly value: string,
  ) {
    super(`Supplier with ${field} "${value}" already exists`);
  }
}

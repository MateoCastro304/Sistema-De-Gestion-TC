import { DomainError } from '../../../shared/domain/errors/domain.error';

/**
 * Raised when a supplier lookup by id finds no matching record. Carries the
 * queried id as a public field so the exception filter can include it in the
 * response body. Mapped to HTTP 404 by the filter.
 */
export class SupplierNotFound extends DomainError {
  constructor(public readonly id: number) {
    super(`Supplier with id ${id} not found`);
  }
}

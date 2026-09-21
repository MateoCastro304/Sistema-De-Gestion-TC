import { DomainError } from '../../../shared/domain/errors/domain.error';

/**
 * Raised when trying to modify a category that is currently inactive. It
 * must be reactivated first. Mapped to HTTP 409 by the filter.
 */
export class CategoryInactive extends DomainError {
    constructor(public readonly id: number) {
        super(`Debe reactivar el rubro antes de modificarlo`);
    }
}

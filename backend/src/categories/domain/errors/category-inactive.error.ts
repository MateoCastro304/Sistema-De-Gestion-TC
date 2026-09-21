import { CategoryDomainError } from './category-domain.error';

/**
 * Raised when trying to modify a category that is currently inactive. It
 * must be reactivated first. Mapped to HTTP 409 by the filter.
 */
export class CategoryInactive extends CategoryDomainError {
    constructor(public readonly id: number) {
        super(`Debe reactivar el rubro antes de modificarlo`);
    }
}

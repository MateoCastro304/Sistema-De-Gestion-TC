import { CategoryDomainError } from './category-domain.error';

/**
 * Raised when a category lookup by id finds no matching record. Carries the
 * queried id as a public field so the exception filter can include it in the
 * response body. Mapped to HTTP 404 by the filter.
 */
export class CategoryNotFound extends CategoryDomainError {
    constructor(public readonly id: number) {
        super(`Category with id ${id} not found`);
    }
}

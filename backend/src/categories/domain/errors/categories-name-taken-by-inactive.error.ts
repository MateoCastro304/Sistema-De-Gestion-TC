import { DomainError } from '../../../shared/domain/errors/domain.error';

/**
 * Raised on create when the requested name matches an inactive category.
 * Carries the inactive category's id so the client can offer reactivation
 * instead of creating a duplicate. Mapped to HTTP 409 by the filter.
 */
export class CategoryNameTakenByInactive extends DomainError {
    constructor(
        public readonly name: string,
        public readonly categoryId: number,
    ) {
        super(`El rubro existe pero está dado de baja`);
    }
}

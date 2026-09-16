import { DomainError } from '../../../shared/domain/errors/domain.error';

/**
 * Raised when a create or update would leave two active categories sharing
 * the same name (case/whitespace-insensitive). Mapped to HTTP 409 by the
 * filter.
 */
export class CategoryNameAlreadyExists extends DomainError {
    constructor(public readonly name: string) {
        super(`Ya existe un rubro con ese nombre`);
    }
}

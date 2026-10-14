import { CategoryDomainError } from './category-domain.error';

/**
 * Raised on create when the requested name matches an inactive category.
 * Carries the inactive category's id so the client can offer reactivation
 * instead of creating a duplicate. Mapped to HTTP 409 by the filter.
 */
export class CategoryNameTakenByInactive extends CategoryDomainError {
  constructor(
    public readonly name: string,
    public readonly categoryId: number,
  ) {
    super(`El rubro existe pero está dado de baja`);
  }
}

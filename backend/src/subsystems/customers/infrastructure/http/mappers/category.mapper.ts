import { Category } from '../../../core/domain/entities/category';

/**
 * Response shape returned by every HTTP endpoint that yields a category.
 */
export type CategoryResponse = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Serializes a persisted Category aggregate into its HTTP response form.
 * Lives in the http layer on purpose: the domain must not learn about JSON
 * or ISO date strings.
 */
export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.getId() as number,
    name: category.getName(),
    active: category.getActive(),
    createdAt: category.getCreatedAt().toISOString(),
    updatedAt: category.getUpdatedAt().toISOString(),
  };
}

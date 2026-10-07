import { Category } from '../category';

export type CategoryListParams = {
  page: number;
  limit: number;
  nameContains?: string;
};

export type CategoryListResult = {
  items: Category[];
  total: number;
};

export abstract class CategoriesRepository {
  abstract save(category: Category): Promise<Category>;
  abstract findById(id: number): Promise<Category | null>;
  abstract list(params: CategoryListParams): Promise<CategoryListResult>;
  abstract findByName(name: string): Promise<Category | null>;
}

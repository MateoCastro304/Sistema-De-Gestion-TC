import { Category } from '../category';

export type CategoryListParams = {
  page: number;
  limit: number;
  nameContains?: string;
  // true (por defecto): solo activos. false: solo inactivos.
  active?: boolean;
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

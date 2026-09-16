import { Category } from '../category';

export abstract class CategoriesRepository {
    abstract save(category: Category): Promise<Category>;
    abstract findById(id: number): Promise<Category | null>;
    abstract findAll(page: number, limit: number): Promise<Category[]>;
    abstract findByName(name: string): Promise<Category | null>;

}
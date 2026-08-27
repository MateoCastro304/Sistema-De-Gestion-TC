import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';

@Injectable()
export class CategoriesRepository {
  // TODO: implementar con PrismaService una vez que tengamos database/ armado
  // y el modelo Category definido en prisma/schema.prisma.
  // findAll() debe devolver solo los rubros activos (WHERE active = true),
  // paginados con skip = (page - 1) * limit, take = limit.

  async findAll(page: number, limit: number): Promise<Category[]> {
    return [];
  }

  async findById(id: number): Promise<Category | null> {
    return null;
  }

  async save(category: Category): Promise<Category> {
    return category;
  }
}

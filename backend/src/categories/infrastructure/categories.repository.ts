import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';

@Injectable()
export class CategoriesRepository {
  // TODO: implementar con PrismaService una vez que tengamos database/ armado
  // y el modelo Category definido en prisma/schema.prisma.

  async findAll(): Promise<Category[]> {
    return [];
  }

  async findById(id: string): Promise<Category | null> {
    return null;
  }

  async save(category: Category): Promise<Category> {
    return category;
  }

  async delete(id: string): Promise<void> {}
}

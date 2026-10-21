import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category';
import { CategoriesRepository } from '../../domain/ports/categories.repository';
import { CategoryNameAlreadyExists } from '../../domain/errors/category-already-exists.error';

export type CreateCategoryInput = {
  name: string;
};

@Injectable()
export class CreateCategory {
  constructor(private readonly repo: CategoriesRepository) {}

  /**
   * El nombre es la clave del rubro: a diferencia de Manager/Factory/Supplier
   * (que usan cuit/cuil, opcionales, y por eso un alta repetida crea una fila
   * nueva) acá no puede haber dos filas con el mismo nombre, activo o no. Si
   * ya existe uno dado de baja con ese nombre, el alta lo reactiva en vez de
   * fallar.
   */
  async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.repo.findByName(input.name);

    if (existing) {
      if (existing.getActive()) {
        throw new CategoryNameAlreadyExists(input.name);
      }
      existing.activate();
      return this.repo.save(existing);
    }

    const category = Category.create(input.name);
    return this.repo.save(category);
  }
}

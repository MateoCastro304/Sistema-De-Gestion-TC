import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/categories.repository';
import { CreateCategoryDto } from '../http/dto/create-category.dto';
import { UpdateCategoryDto } from '../http/dto/update-category.dto';
import { ModuleRef } from '@nestjs/core';
import { FactoryRepository } from '../../factory/domain/factory.repository';

//esta clase se puede inyectar como dependencia en otro lado. Nest sabe como crear una instancia de CategoriesService para dársela al controller.
@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository,
    private readonly moduleRef: ModuleRef,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findByName(dto.name);

    if (existing) {
      if (existing.getActive()) {
        throw new ConflictException('Ya existe un rubro con ese nombre');
      }
      throw new ConflictException({
        message: 'El rubro existe pero está dado de baja',
        categoryId: existing.getId(),
      });
    }

    const category = Category.create(dto.name);
    return this.categoriesRepository.save(category);
  }

  findAll(page: number, limit: number): Promise<Category[]> {
    return this.categoriesRepository.findAll(page, limit);
  }

  findOne(id: number): Promise<Category | null> {
    return this.categoriesRepository.findById(id);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;

    if (dto.name) {
      if (!category.getActive()) {
        throw new ConflictException('Debe reactivar el rubro antes de modificarlo');
      }

      const existing = await this.categoriesRepository.findByName(dto.name);
      if (existing && existing.getId() !== id) {
        throw new ConflictException('Ya existe un rubro con ese nombre');
      }

      category.rename(dto.name);
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;

    const factoryRepository = this.moduleRef.get(FactoryRepository, { strict: false });
    const allFactories = await factoryRepository.findAll();
    const activeFactories = allFactories.filter(
      (f) => f.getCategoryId() === id && f.isActive(),
    );

    if (activeFactories.length > 0) {
      throw new ConflictException({
        message: `No es posible dar de baja el rubro: existen ${activeFactories.length} fábricas activas asociadas. Reasignelas antes de continuar`,
        factories: activeFactories.map((f) => ({ id: f.getId(), name: f.getName() })),
      });
    }

    category.deactivate();
    return this.categoriesRepository.save(category);
  }

  async restore(id: number): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;
    category.activate();  
    return this.categoriesRepository.save(category);
}

}

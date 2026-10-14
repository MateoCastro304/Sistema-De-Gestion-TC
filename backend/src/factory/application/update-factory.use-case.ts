import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';
import { CategoriesRepository } from '../../categories/domain/ports/categories.repository';
import { Factory } from '../domain/factory';
import { FactoryNameAlreadyExists } from '../domain/errors/factory-name-already-exists.error';

export type UpdateFactoryInput = {
  name?: string;
  address?: string | null;
  payMethod?: string | null;
  categoryId?: number;
};

@Injectable()
export class UpdateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(id: number, input: UpdateFactoryInput): Promise<Factory> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoriesRepository.findById(input.categoryId);
      if (!category || !category.getActive()) {
        throw new BadRequestException(`Category with ID ${input.categoryId} not found or inactive`);
      }
    }

    if (input.name !== undefined) {
      const nameTaken = await this.factoryRepository.existsByName(input.name.trim(), id);
      if (nameTaken) {
        throw new ConflictException(new FactoryNameAlreadyExists(input.name.trim()).message);
      }
    }

    // El CUIT no se modifica.
    factory.update(
      input.name ?? factory.getName(),
      input.address === undefined ? factory.getAddress() : input.address,
      input.payMethod === undefined ? factory.getPaymentDescription() : input.payMethod,
      input.categoryId ?? factory.getCategoryId(),
    );

    await this.factoryRepository.update(factory);

    return factory;
  }
}

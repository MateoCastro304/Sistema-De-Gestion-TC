import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../../domain/ports/factory.repository';
import { CategoriesRepository } from '../../domain/ports/categories.repository';
import { Factory } from '../../domain/entities/factory';
import { FactoryNameAlreadyExists } from '../../domain/errors/factory-name-already-exists.error';

export type UpdateFactoryInput = {
  legalName?: string;
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

    if (input.legalName !== undefined) {
      const nameTaken = await this.factoryRepository.existsByName(input.legalName.trim(), id);
      if (nameTaken) {
        throw new ConflictException(new FactoryNameAlreadyExists(input.legalName.trim()).message);
      }
    }

    // El CUIT no se modifica.
    factory.update(
      input.legalName ?? factory.getName(),
      input.address === undefined ? factory.getAddress() : input.address,
      input.payMethod === undefined ? factory.getPaymentDescription() : input.payMethod,
      input.categoryId ?? factory.getCategoryId(),
    );

    await this.factoryRepository.update(factory);

    return factory;
  }
}

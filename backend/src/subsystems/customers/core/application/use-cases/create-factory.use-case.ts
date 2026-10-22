import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../../domain/ports/factory.repository';
import { CategoriesRepository } from '../../domain/ports/categories.repository';
import { Factory } from '../../domain/entities/factory';
import { FactoryAlreadyExists } from '../../domain/errors/factory-already-exists.error';
import { FactoryNameAlreadyExists } from '../../domain/errors/factory-name-already-exists.error';

export type CreateFactoryInput = {
  legalName: string;
  cuit: string;
  address?: string | null;
  payMethod?: string | null;
  categoryId: number;
};

@Injectable()
export class CreateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(input: CreateFactoryInput): Promise<Factory> {
    const category = await this.categoriesRepository.findById(input.categoryId);
    if (!category || !category.getActive()) {
      throw new BadRequestException(`Category with ID ${input.categoryId} not found or inactive`);
    }

    const factory = Factory.create(
      input.cuit,
      input.legalName,
      input.address ?? null,
      input.payMethod ?? null,
      input.categoryId,
    );

    const cuitTaken = await this.factoryRepository.existsByCuit(factory.getCuit());
    if (cuitTaken) {
      throw new ConflictException(new FactoryAlreadyExists(factory.getCuit()).message);
    }

    const nameTaken = await this.factoryRepository.existsByName(factory.getName());
    if (nameTaken) {
      throw new ConflictException(new FactoryNameAlreadyExists(factory.getName()).message);
    }

    return await this.factoryRepository.save(factory);
  }
}

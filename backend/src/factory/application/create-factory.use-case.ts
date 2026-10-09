import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';
import { CategoriesRepository } from '../../categories/domain/ports/categories.repository';
import { CreateFactoryDto } from '../http/dto/create-factory.dto';
import { Factory } from '../domain/factory';
import { FactoryAlreadyExists } from '../domain/errors/factory-already-exists.error';
import { FactoryNameAlreadyExists } from '../domain/errors/factory-name-already-exists.error';

@Injectable()
export class CreateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(dto: CreateFactoryDto): Promise<Factory> {
    const category = await this.categoriesRepository.findById(dto.categoryId);
    if (!category || !category.getActive()) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} not found or inactive`);
    }

    const factory = Factory.create(
      dto.cuit,
      dto.name,
      dto.address ?? null,
      dto.payMethod ?? null,
      dto.categoryId,
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

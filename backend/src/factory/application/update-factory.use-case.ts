import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';
import { CategoriesRepository } from '../../categories/domain/ports/categories.repository';
import { UpdateFactoryDto } from '../http/dto/update-factory.dto';
import { Factory } from '../domain/factory';
import { FactoryNameAlreadyExists } from '../domain/errors/factory-name-already-exists.error';

@Injectable()
export class UpdateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(id: number, dto: UpdateFactoryDto): Promise<Factory> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findById(dto.categoryId);
      if (!category || !category.getActive()) {
        throw new BadRequestException(`Category with ID ${dto.categoryId} not found or inactive`);
      }
    }

    if (dto.name !== undefined) {
      const nameTaken = await this.factoryRepository.existsByName(dto.name.trim(), id);
      if (nameTaken) {
        throw new ConflictException(new FactoryNameAlreadyExists(dto.name.trim()).message);
      }
    }

    // El CUIT no se modifica.
    factory.update(
      dto.name ?? factory.getName(),
      dto.address === undefined ? factory.getAddress() : dto.address,
      dto.payMethod === undefined ? factory.getPaymentDescription() : dto.payMethod,
      dto.categoryId ?? factory.getCategoryId(),
    );

    await this.factoryRepository.update(factory);

    return factory;
  }
}

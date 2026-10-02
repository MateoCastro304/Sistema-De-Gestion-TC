import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';
import { CategoriesRepository } from '../../categories/domain/ports/categories.repository';
import { UpdateFactoryDto } from '../http/dto/update-factory.dto';
import { Factory } from '../domain/factory';
import { Cuit } from '../../suppliers/domain/cuit';
import { FactoryAlreadyExists } from '../domain/errors/factory-already-exists.error';

@Injectable()
export class UpdateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(id: number, dto: UpdateFactoryDto): Promise<Factory> {
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

    if (dto.cuit !== undefined) {
      const normalizedCuit = Cuit.create(dto.cuit).getCuitValue();
      const cuitTaken = await this.factoryRepository.existsByCuit(
        normalizedCuit,
        factory.getId() ?? undefined,
      );
      if (cuitTaken) {
        throw new ConflictException(new FactoryAlreadyExists(normalizedCuit).message);
      }
    }

    factory.update(
      dto.cuit ?? factory.getCuit(),
      dto.name ?? factory.getName(),
      dto.address ?? factory.getAddress(),
      dto.paymentDescription !== undefined ? dto.paymentDescription : factory.getPaymentDescription(),
      dto.categoryId ?? factory.getCategoryId(),
    );

    await this.factoryRepository.update(factory);

    return factory;
  }
}

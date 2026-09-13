import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FactoryRepository } from '../domain/factory.repository';
import { CreateFactoryDto } from '../http/dto/create-factory.dto';
import { UpdateFactoryDto } from '../http/dto/update-factory.dto';
import { Factory } from '../domain/factory';
import { CategoriesRepository } from '../../categories/domain/categories.repository';

@Injectable()
export class FactoriesService {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository
  ) {}

  async create(dto: CreateFactoryDto): Promise<Factory> {

    const category = await this.categoriesRepository.findById(dto.categoryId);
    if (!category || !category.getActive()) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} not found or inactive`);
    }

    const factory = Factory.create(
      dto.cuit,
      dto.name,
      dto.address,
      dto.paymentDescription ?? null,
      dto.categoryId,

    );

    return await this.factoryRepository.save(factory);

  }

  async findAll(): Promise<Factory[]> {
    return await this.factoryRepository.findAll();
  }
  
  async findById(id: number): Promise<Factory> {
    const factory = await this.factoryRepository.findById(id);

    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    return factory;
  }

  async update(id: number, dto: UpdateFactoryDto): Promise<Factory> {
    const factory = await this.findById(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findById(dto.categoryId);
      if (!category || !category.getActive()) {
        throw new BadRequestException(`Category with ID ${dto.categoryId} not found or inactive`);
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

  // --- DESACTIVAR (BAJA LÓGICA) ---
  async deactivate(id: number): Promise<void> {
    const factory = await this.findById(id);
    factory.deactivate();
    await this.factoryRepository.update(factory);
  }

  // --- ACTIVAR ---
  async activate(id: number): Promise<void> {
    const factory = await this.findById(id);
    factory.activate();
    await this.factoryRepository.update(factory);
  }
}

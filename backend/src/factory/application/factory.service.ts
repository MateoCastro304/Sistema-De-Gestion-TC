import { Injectable, NotFoundException } from '@nestjs/common';
import { FactoryRepository } from '../domain/factory.repository';
import { CreateFactoryDto } from '../http/dto/create-factory.dto';
import { UpdateFactoryDto } from '../http/dto/update-factory.dto';
import { Factory } from '../domain/factory';

@Injectable()
export class FactoriesService {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async create(dto: CreateFactoryDto): Promise<Factory> {

    const factory = Factory.create(
      dto.cuit,
      dto.name,
      dto.address,
      dto.paymentDescription ?? null,
      dto.categoryId,

    );

    return await this.factoryRepository.save(factory);

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
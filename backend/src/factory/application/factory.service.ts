import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FactoryRepository, FactoryListParams, FactoryListResult } from '../domain/port/factory.repository';
import { CustomerQuery } from '../domain/port/customer-query.port';
import { CreateFactoryDto } from '../http/dto/create-factory.dto';
import { UpdateFactoryDto } from '../http/dto/update-factory.dto';
import { Factory } from '../domain/factory';
import { CategoriesRepository } from '../../categories/domain/ports/categories.repository';
import { FactoryAlreadyExists } from '../domain/errors/factory-already-exists.error';
import { FactoryHasActiveCustomers } from '../domain/errors/factory-has-active-customers.error';
import { Cuit } from '../../shared/domain/cuit';


@Injectable()
export class FactoriesService {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly categoriesRepository: CategoriesRepository,
    // Opcional: hay código fuera de este módulo (ej. las specs de
    // integración de categories) que instancia FactoriesService a mano con
    // solo los primeros dos argumentos. Si no se provee, deactivate()
    // simplemente omite el chequeo de clientes activos.
    private readonly customerQuery?: CustomerQuery,
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

    const cuitTaken = await this.factoryRepository.existsByCuit(factory.getCuit());
    if (cuitTaken) {
      throw new ConflictException(new FactoryAlreadyExists(factory.getCuit()).message);
    }

    return await this.factoryRepository.save(factory);

  }

  async findAll(): Promise<Factory[]> {
    return await this.factoryRepository.findAll();
  }

  // --- LISTADO PAGINADO ---
  async list(params: FactoryListParams): Promise<FactoryListResult> {
    if (params.page < 1 || params.limit < 1) {
      throw new BadRequestException('page and limit must be positive integers');
    }
    return await this.factoryRepository.list(params);
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

  // --- DESACTIVAR (BAJA LÓGICA) ---
  async deactivate(id: number): Promise<void> {
    const factory = await this.findById(id);

    if (this.customerQuery) {
      const hasActiveCustomers = await this.customerQuery.hasActiveCustomersForFactory(id);
      if (hasActiveCustomers) {
        throw new ConflictException(new FactoryHasActiveCustomers(id).message);
      }
    }

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
